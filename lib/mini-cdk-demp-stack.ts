import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export class MiniCdkDemoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. SQS Queue
    const queue = new sqs.Queue(this, 'AdarshDemoQueue', {
      visibilityTimeout: cdk.Duration.seconds(30)
    });

    // 2. Lambda Producer
    const producerFn = new lambda.Function(this, 'AdarshProducerFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
        const client = new SQSClient();

        exports.handler = async (event) => {
          const body = JSON.parse(event.body);
          const command = new SendMessageCommand({
            QueueUrl: process.env.QUEUE_URL,
            MessageBody: JSON.stringify(body),
          });

          await client.send(command);
          return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Message sent!' })
          };
        };
      `),
      environment: {
        QUEUE_URL: queue.queueUrl
      }
    });

    // 3. Grant producer permission to send messages
    queue.grantSendMessages(producerFn);

    // 4. Add Function URL for the producer
    const fnUrl = producerFn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE
    });

    // 5. IAM Role for the consumer (Dropwizard service in ECS, etc.)
    const consumerRole = new iam.Role(this, 'AdarshQueueConsumerRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com') // adjust if not ECS
    });

    // 6. Grant consumer permission to consume messages
    queue.grantConsumeMessages(consumerRole);

    // 7. Output values
    new cdk.CfnOutput(this, 'ProducerLambdaUrl', {
      value: fnUrl.url
    });

    new cdk.CfnOutput(this, 'QueueUrl', {
      value: queue.queueUrl
    });

    new cdk.CfnOutput(this, 'ConsumerRoleArn', {
      value: consumerRole.roleArn
    });
  }
}
