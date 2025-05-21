pipelineJob('deployment-pipeline') {
  definition {
    cps {
      sandbox(true)
      script("""
        pipeline {
            agent any

            environment {
                DEPLOY_DIR = "\$WORKSPACE/deployment-repo"
            }

            tools {
                git 'git'
                maven 'Maven 3'
            }

            stages {
                stage('Update etc/hosts') {
                    steps {
                        sh '''
                            echo "\$(getent hosts host.docker.internal | awk '{print \$1}') lima-rancher-desktop" >> /etc/hosts
                        '''
                    }
                }
                stage('Clone Deployment Repo') {
                    steps {
                        withCredentials([string(credentialsId: 'github-pat', variable: 'GITHUB_PAT')]) {
                            sh '''
                                rm -rf \$DEPLOY_DIR
                                git clone --branch \$DEV_DEPLOYMENT_BRANCH_NAME https://\$GITHUB_PAT@github.com/\$DEPLOYMENT_REPO "\$DEPLOY_DIR"
                            '''
                        }
                    }
                }
                stage('Extract Image Digest') {
                    steps {
                        dir("\$DEPLOY_DIR/mi") {
                            script {
                                def json = sh(script: "cat \$CONFIG_FILE_PATH", returnStdout: true).trim()
                                def digest = sh(script: "echo '\${json}' | jq -r '.\\"image-sha\\"'", returnStdout: true).trim()
                                env.IMAGE_DIGEST = digest
                            }
                        }
                    }
                }
                stage('Docker Login') {
                    steps {
                        withCredentials([usernamePassword(credentialsId: 'docker-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh '''
                            echo "\$DOCKER_PASS" | docker login -u "\$DOCKER_USER" --password-stdin \$DOCKER_CONTAINER_REGISTRY
                        '''
                        }
                    }
                }
                stage('Deploy to K8s') {
                    steps {
                        dir("\$DEPLOY_DIR/mi") {
                            sh '''
                                helm upgrade --install \$HELM_RELEASE_NAME . -f mi-values.yaml --set wso2.deployment.image.digest=\$IMAGE_DIGEST --namespace \$K8S_NAMESPACE
                            '''
                        }
                    }
                }
            }
        }
        """.stripIndent())
    }
  }
}