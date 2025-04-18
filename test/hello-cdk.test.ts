import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as HelloCdk from '../lib/hello-cdk-stack';

test('Lambda function created', () => {
  const app = new cdk.App();
  const stack = new HelloCdk.HelloCdkStack(app, 'MyTestStack');
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::Lambda::Function', {
    Handler: 'index.handler',
    Runtime: 'nodejs20.x'
  });
  template.hasResourceProperties('AWS::Lambda::Url', {
    AuthType: 'NONE'
  });
});
