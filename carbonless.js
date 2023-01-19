'use strict';

const yaml = require('js-yaml');
const fs = require('fs');

const awsToAzureRegionsMap = {
  'us-east-2':'eastus2',
  'us-east-1':'eastus',
  'us-west-1': 'westus',
  'us-west-2': 'westus2',
  'af-south-1': 'southafricawest', 
  'ap-east-1': 'eastasia', 
  'ap-south-2': 'southindia', 
  'ap-southeast-3': 'southeastasia',
  'ap-south-1': 'centralindia', 
  'ap-northeast-3': 'japanwest', 
  'ap-northeast-2': 'koreacentral', 
  'ap-southeast-1': 'southeastasia', 
  'ap-southeast-2': 'australiaeast', 
  'ap-northeast-1': 'japaneast', 
  'ca-central-1': 'canadacentral', 
  'eu-central-1': 'germanywestcentral', 
  'eu-west-1': 'northeurope',
  'eu-west-2': 'uksouth', 
  'eu-south-1': 'switzerlandnorth', 
  'eu-west-3': 'francecentral', 
  'eu-south-2': 'francesouth', 
  'eu-north-1': 'swedencentral',
  'eu-central-2': 'switzerlandnorth', 
  'me-south-1': 'uaenorth', 
  'me-central-1': 'uaecentral', 
  'sa-east-1': 'brazilsouth',
}
 
class Carbonless {    
    constructor(serverless, options, { log }) {
        this.serverless = serverless;
        this.options = options;
        this.log = log;
        this.provider = this.serverless.getProvider('aws');
        this.hooks = {
            'initialize': () => this.init(),
        };
    }

    async init() {
        // Check if region has been passed as an option
        if (!this.options.region) {
            // Check if default region has been overriden in configuration
            if (!this.regionInConfiguration()){
                // Using default region
                this.log.info(`Currently using using default region ${this.serverless.service.provider.region}. Carbonless plugin is checking for a region with lower carbon intensity`);
                this.serverless.service.provider.region = await this.getRegionWithLowestCarbonIntensity();
                this.log.notice(`Carbonless plugin has changed region to ${this.serverless.service.provider.region}`);
            }
        }
    }

    regionInConfiguration = () => {
      const configurationFilePath = `${this.serverless.serviceDir}/${this.serverless.configurationFilename}`;
      const configurationYaml = yaml.load(fs.readFileSync(configurationFilePath));
      if (configurationYaml.provider.region){
        return true;
      }
      return false;
    }

    getRegionWithLowestCarbonIntensity = async () => {
        let bestRegion;
        let minCarbonIntensity;
        const ec2 = new this.provider.sdk.EC2({region: this.serverless.service.provider.region});
        const regions = [];
        const regionsJSON = await ec2.describeRegions().promise();
        for (let i = 0; i < regionsJSON.Regions.length; i++){
            regions.push(regionsJSON.Regions[i].RegionName);
        }
        for (let i=0; i < regions.length; i++){
          try {
              const result = await this.getRegionCarbonIntensity(awsToAzureRegionsMap[regions[i]]);
              if (result[0]){
                const carbonIntensity = result[0]['forecastData'][0]['value'];
                this.log.info(`Forecasted Carbon Intensity in ${regions[i]} is ${carbonIntensity}`);
                if (minCarbonIntensity){
                    if (carbonIntensity < minCarbonIntensity){
                        bestRegion = regions[i];
                        minCarbonIntensity = carbonIntensity;
                    }
                } else {
                    bestRegion = regions[i];
                    minCarbonIntensity = carbonIntensity;
                }
              }
          } catch (error){
              console.log(error);
          }   
        }
        this.log.notice(`The region with the lowest carbon intensity is ${bestRegion}`);
        return bestRegion;
    };
  
    getRegionCarbonIntensity = (region) => {
        const https = require('https');
        const forecastAPI = 'https://carbon-aware-api.azurewebsites.net/emissions/forecasts/current';
        const hours = 10;
        const dataEndAt = new Date(Date.now() + hours*3600000).toISOString();
        
        return new Promise((resolve, reject) => {
            const req = https.get(forecastAPI + `?location=${region}&dataEndAt=${dataEndAt}`, (res) => {
                let data = '';
                res.on('data', chunk => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                      resolve(JSON.parse(data));
                    } catch (err) {
                      reject(new Error(err));
                    }
                });
            });
            req.on('error', err => {
                reject(new Error(err));
            });
        });
        
    };
}
 
module.exports = Carbonless;