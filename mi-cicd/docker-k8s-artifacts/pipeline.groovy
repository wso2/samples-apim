pipelineJob('integration-pipeline') {
  definition {
    cps {
      sandbox(true)
      script("""
        pipeline {
            agent any

            parameters {
                booleanParam(name: 'PERFORM_RELEASE', defaultValue: false, description: 'Perform Docker Release')
            }

            environment {
                PROJECT_DIR = "\$WORKSPACE/currency-converter"
                DEPLOY_DIR = "\$WORKSPACE/deployment-repo"
                IMAGE_TAG_BRANCH_NAME = "update-image-sha"
            }

            tools {
                git 'git'
                maven 'Maven 3'
            }

            stages {
                stage('Clone Integration Project') {
                    steps {
                        withCredentials([string(credentialsId: 'github-pat', variable: 'GITHUB_PAT')]) {
                            sh '''
                                rm -rf \$PROJECT_DIR
                                git clone https://\$GITHUB_PAT@github.com/\$PROJECT_REPO "\$PROJECT_DIR"
                            '''
                        }
                    }
                }
                stage('Build Integration Project') {
                    steps {
                        dir("\$PROJECT_DIR") {
                            withCredentials([string(credentialsId: 'github-pat', variable: 'GITHUB_PAT')]) {
                                sh '''
                                    git config --global credential.helper store
                                    git config --global user.email "\$GIT_SCM_CONFIG_EMAIL"
                                    echo "https://\$GITHUB_PAT:@github.com" > ~/.git-credentials
                                '''
                            }
                            script {
                                if (params.PERFORM_RELEASE) {
                                    sh 'set -e'
                                    sh 'mvn -Darguments="-Dmaven.deploy.skip=true" release:prepare release:perform -Pdocker | tee build.log'

                                    def digestLine = sh(script: "grep 'DOCKER> \\\\[.*\\\\]: Built image sha256:' build.log", returnStdout: true).trim()

                                    def matcher = digestLine =~ /DOCKER> \\[(.+?):(.+?)\\]: Built image sha256:([a-f0-9]+)/
                                    if (!matcher) {
                                        error("Could not extract Docker digest from Maven output")
                                    }

                                    def imageName = matcher[0][1]
                                    def imageTag = matcher[0][2]

                                    env.FULL_IMAGE = "\$imageName:\$imageTag"

                                    echo "Built image: \$env.FULL_IMAGE"
                                } else {
                                    sh 'mvn clean install'
                                }
                            }
                        }
                    }
                }
                stage('Docker Login') {
                    when {
                        expression { params.PERFORM_RELEASE }
                    }
                    steps {
                        withCredentials([usernamePassword(credentialsId: 'docker-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh '''
                            echo "\$DOCKER_PASS" | docker login -u "\$DOCKER_USER" --password-stdin \$DOCKER_CONTAINER_REGISTRY
                        '''
                        }
                    }
                }
                stage('Push Docker Image') {
                    when {
                        expression { params.PERFORM_RELEASE }
                    }
                    steps {
                        dir("\$PROJECT_DIR") {
                            script {
                                sh(script: "docker image tag \$FULL_IMAGE \$DOCKER_CONTAINER_REGISTRY/\$DOCKER_IMAGE_REPO/\$FULL_IMAGE", returnStdout: true)
                                sh(script: "docker image push \$DOCKER_CONTAINER_REGISTRY/\$DOCKER_IMAGE_REPO/\$FULL_IMAGE 2>&1 | tee push.log")
                                env.IMAGE_DIGEST = sh(script: "cat push.log | grep -o 'sha256:[a-f0-9]\\\\{64\\\\}' | tail -n1", returnStdout: true).trim()
                            }
                        }
                    }
                }
                stage('Clone Deployment Repo') {
                    when {
                        expression { params.PERFORM_RELEASE }
                    }
                    steps {
                        withCredentials([string(credentialsId: 'github-pat', variable: 'GITHUB_PAT')]) {
                            sh '''
                                rm -rf \$DEPLOY_DIR
                                git clone --branch \$DEV_DEPLOYMENT_BRANCH_NAME https://\$GITHUB_PAT@github.com/\$DEPLOYMENT_REPO "\$DEPLOY_DIR"
                            '''
                        }
                    }
                }
                stage('Update and commit image digest') {
                    when {
                        expression { params.PERFORM_RELEASE }
                    }
                    steps {
                        dir("\$DEPLOY_DIR/mi") {
                            sh '''
                                git checkout -b \$IMAGE_TAG_BRANCH_NAME
                                jq --arg new_sha "\$IMAGE_DIGEST" '.["image-sha"] = \$new_sha' "\$CONFIG_FILE_PATH" > tmp.json && mv tmp.json "\$CONFIG_FILE_PATH"
                                cat \$CONFIG_FILE_PATH
                                git add "\$CONFIG_FILE_PATH"
                                git config --global user.email "\$GIT_SCM_CONFIG_EMAIL"
                                git commit -m "Update image sha"
                                git push -f origin \$IMAGE_TAG_BRANCH_NAME
                            '''
                        }
                    }
                }

                stage('Create Pull Request') {
                    when {
                        expression { params.PERFORM_RELEASE }
                    }
                    steps {
                        dir("\$DEPLOY_DIR") {
                            withCredentials([string(credentialsId: 'github-pat', variable: 'GITHUB_PAT')]) {
                                sh '''
                                    echo "\$GITHUB_PAT" | gh auth login --with-token
                                    gh pr create \
                                    --title "Update image to \$FULL_IMAGE" \
                                    --body "Auto-generated PR with digest: \$IMAGE_DIGEST" \
                                    --base \$DEV_DEPLOYMENT_BRANCH_NAME \
                                    --head \$IMAGE_TAG_BRANCH_NAME
                                '''
                            }
                        }
                    }
                }
            }
        }
        """.stripIndent())
    }
  }
}