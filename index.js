let AWS = require("aws-sdk");
let uuid = require('uuid');

let version = process.argv[2];

if (!version) {
  throw "You have to specify version";
}

let credentials = new AWS.SharedIniFileCredentials();
AWS.config.credentials = credentials;
AWS.config.region = "us-east-1";

let docClient = new AWS.DynamoDB.DocumentClient();
let table = "CronAppRelease";

let params = {
  TableName: table,
  FilterExpression: "version = :version ",
  ExpressionAttributeValues: {
    ":version": version
  }
};

docClient.scan(params).promise().then((data) => {
  if (!data.Items.length) {
    let tiers = [];
    let enabled = 0;
    if (version.toLowerCase().indexOf("-sp.") != -1) {
      tiers.push("staging");
      enabled = 1;
    }

    if (version.toLowerCase().indexOf("-rc.") != -1) {
      tiers.push("alpha");
      enabled = 1;
    }

    let putData = {
      TableName: table,
      Item: {
        "id": uuid.v1(),
        "version": version,
        "tiers": tiers,
        "creationDate": new Date().toISOString(),
        "enabled": enabled,
        "instantUpdate": 0,
        "notes": ''
      }
    }

    docClient.put(putData, (err, data) => {
      if (err) {
        console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
      } else {
        console.log("Added item:", JSON.stringify(putData.Item, null, 2));
      }
    });
  }
});
