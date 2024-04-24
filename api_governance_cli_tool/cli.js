#!/usr/bin/env node

/*
 * Copyright (c) 2024, WSO2 LLC. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

const {
    program
} = require('commander');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const {
    Spectral
} = require('@stoplight/spectral-core');
const {
    bundleAndLoadRuleset
} = require('@stoplight/spectral-ruleset-bundler/with-loader');
const {
    fetch
} = require('@stoplight/spectral-runtime');
const https = require('https');
const yaml = require('js-yaml');
let rulesPath = path.join('rules', 'rules.yaml');
const readline = require('readline');

// Commands
program
    .command('validate')
    .description('Validate a specific API by ID or validate all APIs')
    .helpOption()
    .option('--api <apiId>', 'Validate a specific API by ID')
    .option('--all', 'Validate all APIs', false) // default value for --all is false
    .option('-d, --directory <unzipDirectoryPath>', 'Validate API inside the locally given directory')
    .option('--verbose', 'Print detailed logs', false)
    .option('--ruleset  <ruleset>', 'Specify the ruleset to be used for validation')
    .action(async (options) => {
        await main(options).catch(console.error);
    });

program.parse(process.argv);

// configurations
async function loadConfig(options) {
    try {
        const fileContents = fs.readFileSync('config.yaml', 'utf8');
        config = yaml.load(fileContents);
        const fieldsToCheck = [];
        if (options.all || options.api) {
            // Define the configuration fields to check and prompt if necessary
            fieldsToCheck = [{
                    key: ['User', 'username'],
                    prompt: 'Enter your username:'
                },
                {
                    key: ['User', 'password'],
                    prompt: 'Enter your password:',
                    type: 'password'
                },
                {
                    key: ['User', 'clientId'],
                    prompt: 'Enter your client ID:'
                },
                {
                    key: ['User', 'clientSecret'],
                    prompt: 'Enter your client secret:'
                },
                {
                    key: ['Server', 'hostname'],
                    prompt: 'Enter your server hostname:'
                },
                {
                    key: ['Server', 'port'],
                    prompt: 'Enter your server port:'
                },
            ];
        }
        for (const field of fieldsToCheck) {
            if (!getValueByPath(config, field.key)) {
                const answer = await askQuestion(field.prompt);
                setValueByPath(config, field.key, answer);
            }
        }
    } catch (error) {
        console.error('Error reading the config file:', error);
        process.exit(1);
    }
    return config;
}

function getValueByPath(obj, path) {
    return path.reduce((acc, part) => acc && acc[part], obj);
}

function setValueByPath(obj, path, value) {
    path.reduce((o, k, i, arr) => {
        if (i === arr.length - 1) {
            o[k] = value;
            return value;
        }
        return (o[k] = o[k] || {});
    }, obj);
}

function createRuleFiles(ruleset) {
    if (ruleset && ruleset !== '') {
        rulesPath = ruleset;
    }
    const rules = yaml.load(fs.readFileSync(rulesPath, 'utf8'));
    for (const [type, content] of Object.entries(rules)) {
        __filename = path.join('rules', `${type.toLowerCase().replace('_', '-')}.yaml`);
        const contentToWrite = content.rules ? {
            rules: content.rules
        } : {};
        const yamlContent = yaml.dump(contentToWrite);
        fs.writeFileSync(__filename, yamlContent, 'utf8');
    }
}

async function getAccessToken() {
    const clientDetails = Buffer.from(`${config.User.clientId}:${config.User.clientSecret}`).toString("base64");
    const grantTypes =
        `grant_type=password` +
        `&username=${encodeURIComponent(config.User.username)}` +
        `&password=${encodeURIComponent(config.User.password)}` +
        `&scope=${encodeURIComponent(
            'apim:api_view ' +
            'apim:api_create ' +
            'apim:app_import_export ' +
            'apim:api_import_export ' +
            'apim:api_product_import_export ' +
            'apim:admin ' +
            'apim:api_publish ' +
            'apim:subscribe ' +
            'apim:app_manage ' +
            'apim:sub_manage ' +
            'apim:api_delete ' +
            'apim:app_owner_change'
    )}`;

    return new Promise((resolve, reject) => {
        const token = {
            hostname: `${config.Server.hostname}`,
            port: `${config.Server.port}`,
            path: `/oauth2/token`,
            method: 'POST',
            headers: {
                'Authorization': `Basic ${clientDetails}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(grantTypes)
            },
            rejectUnauthorized: false, // -k option
        };

        const getToken = https.request(token, response => {
            let data = '';
            response.on('data', chunk => data += chunk);
            response.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    if (response.statusCode == 400) {
                        reject('Authentication failed: provided username or password is Invalid.');
                    } else if (response.statusCode == 401) {
                        reject('Authentication failed: provided client ID or client secret is Invalid.');
                    } else if (parsedData.access_token) {
                        resolve(parsedData.access_token);
                    } else {
                        reject('Token not found in the response.');
                    }
                } catch (error) {
                    console.error(`Error parsing the response: ${error.message}`);
                    reject('An error occurred while processing the response.');
                }
            });
        });
        getToken.on('error', (error) => {
            reject('An error occurred during the request.');
        });

        getToken.write(grantTypes);
        getToken.end();
    });
}

async function main(options) {
    console.log("CLI tool to Validate API(s)");

    config = await loadConfig(options);

    createRuleFiles(options.ruleset);

    if (options.api || options.all) {
        const accessToken = await getAccessToken();
        console.log('\nFetching the API(s) ...');
        const apiDetails = await getApiDetails(accessToken, options.api);
        console.log(`Retrieved API count: ${apiDetails.length}`);
        console.log("Validating API(s)");
        state = await processApis(apiDetails, accessToken, options.verbose);
    } else if (options.directory) {
        console.log('\nValidating an API from the given directory...');
        state = await validateDirectory(options.directory, options.verbose);
    } else {
        console.log("No valid option provided, use --help for command help.");
    }

    console.log("Validation completed. Check the reports directory for the validation report.");
    if (state) {
        process.exit(0);
    } else {
        process.exit(1);
    }
}

function requestApiDetails(options) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (response) => {
            let data = '';
            response.on('data', (chunk) => (data += chunk));
            response.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', (error) => reject(error));
        req.end();
    });
}

async function getApiDetails(token, apiId) {
    const limit = 25;
    let offset = 0;
    const totalApiList = [];
    let count = 0;
    "admin", "TrainStationAPI", "1.0.0", "2166e768-7940-47cd-9604-4f0ac70fa79f", "Emily Johnson", "emily.johnson@railco.com", "John Doe", "john.doe@railco.com", "api.yaml", "api-name: API name does not follow the PascalCase naming convention. at data.name"

    do {
        const listAPI = {
            hostname: `${config.Server.hostname}`,
            port: `${config.Server.port}`,
            path: apiId ? `/api/am/publisher/v4/apis/${apiId}` : `/api/am/publisher/v4/apis?limit=${limit}&offset=${offset}`,
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            rejectUnauthorized: false, // Equivalent to -k option in curl
        };
        try {
            const apiResponse = await requestApiDetails(listAPI);
            let apis = [];
            if (apiResponse.list) {
                apis = apiResponse.list.map(api => ({
                    id: api.id,
                    name: api.name,
                    version: api.version,
                    provider: api.provider,
                    businessOwner: api.businessOwner,
                    businessOwnerEmail: api.businessOwnerEmail,
                    technicalOwner: api.technicalOwner,
                    technicalOwnerEmail: api.technicalOwnerEmail,
                }));
            } else {
                apis = [{
                    id: apiResponse.id,
                    name: apiResponse.name,
                    version: apiResponse.version,
                    provider: apiResponse.provider,
                    businessOwner: apiResponse.businessInformation?.businessOwner,
                    businessOwnerEmail: apiResponse.businessInformation?.businessOwnerEmail,
                    technicalOwner: apiResponse.businessInformation?.technicalOwner,
                    technicalOwnerEmail: apiResponse.businessInformation?.technicalOwnerEmail,
                }, ];
            }
            totalApiList.push(...apis);
            count = apis.length;
            offset += limit;
        } catch (error) {
            console.error('Error fetching APIs:', error);
            break; // Exit the loop in case of error
        }
    } while (count === limit);
    return totalApiList;
}

async function downloadApiZipFile(apiDetail, token, index) {
    const exportDir = path.join(process.cwd(), 'exports');
    const filePath = path.join(exportDir, `exportAPI_${index}.zip`);
    ensureDirectoryExists(exportDir);

    const exportAPI = {
        hostname: config.Server.hostname,
        port: config.Server.port,
        path: `/api/am/publisher/v4/apis/export?apiId=${apiDetail.id}&format=YAML`,
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        rejectUnauthorized: false
    };

    await downloadFile(exportAPI, filePath);
    return filePath;
}

async function downloadFile(options, filePath) {
    ensureDirectoryExists(path.dirname(filePath));
    return new Promise((resolve, reject) => {
        const fileStream = fs.createWriteStream(filePath);
        const req = https.request(options, response => {
            response.pipe(fileStream);
            fileStream.on('finish', () => {
                fileStream.close(resolve);
            });
        });
        req.on('error', (error) => {
            console.error('Download error:', error);
            reject(error);
        });
        req.end();
    });
}

async function extractAndValidateApi(apiDetail, filePath, zippedFile) {
    let extractedDir = path.join('extracted_APIs');
    ensureDirectoryExists(extractedDir);

    if (zippedFile) {
        const zip = new AdmZip(filePath);
        zip.extractAllTo(extractedDir, true);
    } else {
        extractedDir = path.dirname(filePath);
    }
    const apiExtractDirectoryName = `${apiDetail.name}-${apiDetail.version}`;
    const documentpath = path.join(extractedDir, apiExtractDirectoryName, 'Docs');
    let docsCount = 0;

    if (fs.existsSync(documentpath)) {
        const files = fs.readdirSync(documentpath);
        docsCount = files.length;
    } else {
        docsCount = 0;
    }

    const docYaml = yaml.dump({
        documents: {
            count: docsCount,
        },
    });
    const docsYamlPath = path.join(extractedDir, apiExtractDirectoryName, 'docs.yaml');
    fs.writeFileSync(docsYamlPath, docYaml);

    const apiData = await validateExtractedApis(apiDetail, extractedDir);

    return apiData;

}

async function validateExtractedApis(apiDetail, directory) {
    let apiCsvRows = [];
    const apiExtractDirectoryName = `${apiDetail.name}-${apiDetail.version}`;
    const filePathSwagger = path.join('Definitions', 'swagger.yaml');
    const apiYamlPath = path.join(directory, apiExtractDirectoryName, 'api.yaml');
    const swaggerYamlPath = path.join(directory, apiExtractDirectoryName, filePathSwagger);
    const docsYamlPath = path.join(directory, apiExtractDirectoryName, 'docs.yaml');
    const apiRulesetPath = path.join(process.cwd(), 'rules', 'api-rules.yaml');
    const swaggerRulesetPath = path.join(process.cwd(), 'rules', 'swagger-rules.yaml');
    const docsRulesetPath = path.join(process.cwd(), 'rules', 'docs-rules.yaml');
    let validationMessages1 = '';
    let validationMessages2 = '';
    let validationMessages3 = '';

    if (fs.existsSync(apiRulesetPath)) {
        validationMessages1 = await validateApi(apiYamlPath, apiRulesetPath);
    }

    if (fs.existsSync(swaggerRulesetPath)) {
        validationMessages2 = await validateApi(swaggerYamlPath, swaggerRulesetPath);
    }

    if (fs.existsSync(docsRulesetPath)) {
        validationMessages3 = await validateApi(docsYamlPath, docsRulesetPath);
    }
    apiCsvRows = validationMessages1
        .concat(validationMessages2)
        .concat(validationMessages3)
        .map(msg => {
            const cleanedMsg = msg.replace(/,/g, '');
            const firstWord = cleanedMsg.split(' ')[0].split('-')[0].toLowerCase();
            let errorType = '';
            if (firstWord === 'api') {
                errorType = 'api.yaml';
            } else if (firstWord === 'swagger') {
                errorType = 'swagger.yaml';
            } else if (firstWord === 'documentation') {
                errorType = 'doc.yaml';

            }
            return [
                `"${apiDetail.provider}"`,
                `"${apiDetail.name}"`,
                `"${apiDetail.version}"`,
                `"${apiDetail.id}"`,
                `"${apiDetail.businessOwner}"`,
                `"${apiDetail.businessOwnerEmail}"`,
                `"${apiDetail.technicalOwner}"`,
                `"${apiDetail.technicalOwnerEmail}"`,
                `"${errorType}"`,
                `"${cleanedMsg.replace(/"/g, '""')}"`,
            ].join(",");
        });

    return apiCsvRows;

}

async function processApis(apiDetails, token, verbose) {

    const csvFilePath = createCsvFilePath();
    let csvRows = [];

    for (let i = 0; i < apiDetails.length; i++) {
        const filePath = await downloadApiZipFile(apiDetails[i], token, i);
        const extractedData = await extractAndValidateApi(apiDetails[i], filePath, 1);
        csvRows.push(...extractedData);
    }
    if (verbose) {
        console.log('==================================================');
        console.log('             Validation results');
        console.log('==================================================');
        for (const row of csvRows) {
            console.log(row);
        }
        console.log('==================================================');
        console.log('          End of validation results.')
        console.log('==================================================');
    }
    writeCsv(csvFilePath, csvRows);
    return csvRows.length == 0;
}

async function validateDirectory(directoryPath, verbose) {
    const csvFilePath = createCsvFilePath();
    let csvRows = [];
    const apiDetailsMapped = mapLocalApiDetails(directoryPath);
    const extractedData = await extractAndValidateApi(apiDetailsMapped, directoryPath, 0);
    csvRows.push(...extractedData);
    if (verbose) {
        console.log('==================================================');
        console.log('             Validation results');
        console.log('==================================================');
        for (const row of csvRows) {
            console.log(row);
        }
        console.log('==================================================');
        console.log('          End of validation results.')
        console.log('==================================================');
    }
    writeCsv(csvFilePath, csvRows);
    return csvRows.length == 0;
}

function mapLocalApiDetails(directoryPath) {
    const filePath = path.join(directoryPath, 'api.yaml');
    try {
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const apiYaml = yaml.load(fileContents);

        return {
            id: apiYaml.data.id,
            name: apiYaml.data.name,
            version: apiYaml.data.version,
            provider: apiYaml.data.provider,
            businessOwner: apiYaml.data.businessInformation ? apiYaml.data.businessInformation.businessOwner : '',
            businessOwnerEmail: apiYaml.data.businessInformation ? apiYaml.data.businessInformation.businessOwnerEmail : '',
            technicalOwner: apiYaml.data.businessInformation ? apiYaml.data.businessInformation.technicalOwner : '',
            technicalOwnerEmail: apiYaml.data.businessInformation ? apiYaml.data.businessInformation.technicalOwnerEmail : '',
        };
    } catch (error) {
        console.error('Failed to read or parse the API YAML file:', error);
        return null;
    }
}

// Validating and Reporting
async function validateApi(apiFile, rulesetPath) {
    const spectral = new Spectral();

    spectral.setRuleset(
        await bundleAndLoadRuleset(rulesetPath, {
            fs,
            fetch
        })
    );

    const apiSpec = fs.readFileSync(path.resolve(apiFile), 'utf8');
    const results = await spectral.run(apiSpec);

    const messages = [];
    if (results.length > 0) {
        results.forEach((result) => {
            messages.push(`${result.code}: ${result.message} at ${result.path.join('.')}`);
        });
    }
    return messages;
}

function writeCsv(filePath, rows) {
    const header =
        `"Provider","API Name","Version","ID","Business Owner","Business Owner Email","Technical Owner",` +
        `"Technical Owner Email","Violation Type","Violations"\n`;
    fs.writeFileSync(filePath, header + rows.join('\n'));
}


// Other fucntions
async function askQuestion(query) {
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.stdoutMuted = false;
    let promptLength = query.length;

    rl._writeToOutput = function(stringToWrite) {
        if (!rl.stdoutMuted) {
            rl.output.write(stringToWrite);
            if (stringToWrite.substring(0, promptLength) === query) {
                if (query.includes('password') || query.includes('secret')) {
                    rl.stdoutMuted = true;
                }
            }
        }
    }

    return new Promise((resolve) => {
        rl.question(query, (ans) => {
            rl.close();
            resolve(ans);
        });
    });
}

function createTimestamp() {
    const now = new Date();
    return `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}_${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;
}

function createCsvFilePath() {
    const timeStamp = createTimestamp();
    const reportsDir = path.join(process.cwd(), "reports");
    ensureDirectoryExists(reportsDir);
    return path.join(reportsDir, `Violation_Report_${timeStamp}.csv`);
}

function ensureDirectoryExists(directoryPath) {
    if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, {
            recursive: true
        });
    }
}
