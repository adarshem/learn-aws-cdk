# Getting Started with AWS CDK (TypeScript)

This guide walks you through setting up and deploying your first AWS CDK app using TypeScript.

---

## ✨ 1. Install AWS CLI

### 📆 macOS (with Homebrew):
```bash
brew install awscli
```

### 🚀 Check installation:
```bash
aws --version
```

---

## 🔐 2. Create an IAM User

1. Go to the [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click **Users > Add user**
3. Enter a user name (e.g., `cdk-admin`)
4. Select **Access key - Programmatic access**
5. Attach policies directly > select **AdministratorAccess**
6. Complete setup and download the credentials or note the Access Key and Secret

---

## ⚙️ 3. Configure AWS on Your Machine

Use the credentials from your IAM user to configure the AWS CLI:
```bash
aws configure
```

Enter:
```
AWS Access Key ID: <your-key>
AWS Secret Access Key: <your-secret>
Default region name: us-west-2  # or your preferred region
Default output format: json
```

### ✅ Verify:
```bash
aws sts get-caller-identity
```

---

## 🏠 4. Install AWS CDK

### Install globally with npm:
```bash
npm install -g aws-cdk
```

### Verify:
```bash
cdk --version
```

---

## 📚 5. Create Your CDK App

### Create a new folder:
```bash
mkdir my-cdk-app && cd my-cdk-app
```

### Initialize the CDK app with TypeScript:
```bash
cdk init app --language typescript
```

### Install dependencies:
```bash
npm install
```

---

## 🌟 6. Bootstrap Your Environment

Bootstrapping sets up necessary AWS resources (like an S3 bucket for deployment assets).

### Set environment variables (optional):
```bash
export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
export CDK_DEFAULT_REGION=us-west-2
```

### Run bootstrap:
```bash
cdk bootstrap aws://$CDK_DEFAULT_ACCOUNT/$CDK_DEFAULT_REGION
```

---

## 📅 7. Add a Simple Construct (e.g., SQS Queue)

Edit `lib/my-cdk-app-stack.ts`:
```ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';

export class MyCdkAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new sqs.Queue(this, 'MyFirstQueue', {
      visibilityTimeout: cdk.Duration.seconds(30),
    });
  }
}
```

---

## 🚀 8. Build, Synth, Deploy

### Build the TypeScript project:
```bash
npm run build
```

### Generate CloudFormation template:
```bash
cdk synth
```

### Deploy to AWS:
```bash
cdk deploy
```

---

## 💪 9. Clean Up

To delete the deployed resources:
```bash
cdk destroy
```

---

## 🌟 Bonus Tips

- Use `cdk diff` to see what changes will be deployed.
- CDK apps can have multiple stacks.
- Use `.env` or `cdk.json` to manage environment configs.

Happy Building with CDK! 🎉

