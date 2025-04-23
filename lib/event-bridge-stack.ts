import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';

export class EventBridgeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a custom event bus
    const customEventBus = new events.EventBus(this, 'CustomEventBus', {
      eventBusName: 'MyCustomEventBus'
    });

    // Create an SQS queue to receive events
    const eventQueue = new sqs.Queue(this, 'EventQueue', {
      visibilityTimeout: cdk.Duration.seconds(300),
      queueName: 'EventBridgeQueue'
    });

    // Create a rule to route events to SQS
    const eventRule = new events.Rule(this, 'EventRule', {
      eventBus: customEventBus,
      eventPattern: {
        source: ['myapp'],
        detailType: ['order']
      }
    });

    // Add SQS as a target for the rule
    eventRule.addTarget(new targets.SqsQueue(eventQueue));

    // Create a Lambda function to put events
    const eventProducerLambda = new lambda.Function(
      this,
      'EventProducerLambda',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
          const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');
          const eventBridge = new EventBridgeClient();
          
          exports.handler = async function(event) {
            try {
              const requestBody = event.body ? JSON.parse(event.body) : {};
              
              const orderEvent = {
                orderId: requestBody.orderId || '12345',
                amount: requestBody.amount || 100,
                timestamp: new Date().toISOString(),
                ...requestBody
              };

              const params = {
                Entries: [{
                  EventBusName: 'MyCustomEventBus',
                  Source: 'myapp',
                  DetailType: 'order',
                  Detail: JSON.stringify(orderEvent)
                }]
              };
              
              const command = new PutEventsCommand(params);
              const result = await eventBridge.send(command);
              
              return {
                statusCode: 200,
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  message: 'Event sent successfully',
                  event: orderEvent,
                  result: result
                })
              };
            } catch (error) {
              console.error('Error sending event:', error);
              return {
                statusCode: 500,
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  message: 'Error sending event',
                  error: error.message || 'Unknown error'
                })
              };
            }
          };
        `)
      }
    );

    // Create a Lambda function to consume events
    const eventConsumerLambda = new lambda.Function(
      this,
      'EventConsumerLambda',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
          const { SQSClient } = require('@aws-sdk/client-sqs');
          const sqs = new SQSClient();
          
          exports.handler = async function(event) {
            console.log('Received SQS event:', JSON.stringify(event, null, 2));
            
            for (const record of event.Records) {
              const message = JSON.parse(record.body);
              console.log('Processing message:', JSON.stringify(message, null, 2));
              
              // Here you can add your business logic to process the event
              // For example, store in a database, send notifications, etc.
              
              console.log('Successfully processed message:', record.messageId);
            }
          };
        `)
      }
    );

    // Grant Lambda permissions to put events to the custom event bus
    customEventBus.grantPutEventsTo(eventProducerLambda);

    // Grant consumer Lambda permissions to read from SQS
    eventQueue.grantConsumeMessages(eventConsumerLambda);

    // Add SQS as an event source for the consumer Lambda
    eventConsumerLambda.addEventSource(
      new lambdaEventSources.SqsEventSource(eventQueue)
    );

    // Create a Lambda function URL for easy invocation
    const functionUrl = eventProducerLambda.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE
    });

    // Output the Lambda function URL
    new cdk.CfnOutput(this, 'EventProducerUrl', {
      value: functionUrl.url,
      description: 'URL to invoke the event producer Lambda'
    });

    // Output the SQS queue URL
    new cdk.CfnOutput(this, 'EventQueueUrl', {
      value: eventQueue.queueUrl,
      description: 'URL of the SQS queue receiving events'
    });
  }
}
