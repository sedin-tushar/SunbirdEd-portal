
/**
 * @file        - Entry file referencing Storage Service
 * @description - Entry file referencing Storage Service
 * @exports     - `AzureStorageService` and `AWSStorageService`
 * @since       - 5.0.0
 * @version     - 1.0.0
 */

 const AzureStorageService = require('./AzureStorageService');
 const AWSStorageService   = require('./AWSStorageService');
 const envHelper           = require('../../helpers/environmentVariablesHelper');
 
 const cloudProvider       = envHelper.sunbird_cloud_storage_provider;

/**
 * Based on Environment Cloud Provider value
 * Export respective Storage Service
 */

switch (cloudProvider) {
  case 'azure':
    exports.CLOUD_CLIENT = new AzureStorageService();
    break;
  case 'aws':
    exports.CLOUD_CLIENT = new AWSStorageService();
    break;
  default:
    break;
}
