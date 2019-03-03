const AWS = require("aws-sdk");
const admin = require("firebase-admin");
const firebaseDatabaseEndpoint = process.env.FIREBASE_DATABASE_ENDPOINT;

const s3 = new AWS.S3();
const params = {
  Bucket: process.env.S3_BUCKET_NAME,
  Key: process.env.FIREBASE_ACCOUNT_FILE
};

const initializeFirebase = async () => {
  let accountFile = await s3.getObject(params).promise();
  let serviceAccount = JSON.parse(accountFile.Body.toString());

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: firebaseDatabaseEndpoint
  });
};

exports.handler = async (event, context, callback) => {
  if (!admin.apps.length) {
    await initializeFirebase();
  }

  // firebase uid 検証
  const uid = await admin
    .auth()
    .verifyIdToken(event.token)
    .then(decodedToken => {
      return decodedToken.uid;
    })
    .catch(error => {
      console.log(error);
      return null;
    });

  if (uid) {
    // 検証に成功している場合実行する処理
    console.log("hello firebase");

    const response = {
      statusCode: 200,
      body: {
        message: "verify token success.",
        uid: uid
      }
    };

    return response;
  } else {
    const response = {
      statusCode: 401,
      body: {
        message: "verify token failure."
      }
    };

    return response;
  }
};
