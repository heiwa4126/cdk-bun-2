import { App, Validations } from "aws-cdk-lib/core";
import { AwsSolutionsChecks } from "cdk-nag";
import { CdkBun2Stack } from "./cdk-bun-2-stack";

function getStackName(baseStackName: string, rawSuffix?: string): string {
	return rawSuffix ? `${baseStackName}-${rawSuffix}` : baseStackName;
}

const app = new App();
const rawSuffix = process.env.STACK_SUFFIX?.trim();

new CdkBun2Stack(app, getStackName("CdkBun2Stack", rawSuffix), {
	/* If you don't specify 'env', this stack will be environment-agnostic.
	 * Account/Region-dependent features and context lookups will not work,
	 * but a single synthesized template can be deployed anywhere. */
	/* Uncomment the next line to specialize this stack for the AWS Account
	 * and Region that are implied by the current CLI configuration. */
	// env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
	/* Uncomment the next line if you know exactly what Account and Region you
	 * want to deploy the stack to. */
	// env: { account: '123456789012', region: 'us-east-1' },
	/* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

// cdk-nag things
// app.node.addMetadata(Validations.ACKNOWLEDGED_RULES_METADATA_KEY, {
// 	"annotation::AwsSolutions-IAM4[Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole]":
// 		"Lambda basic execution role is required so the function can write logs to CloudWatch Logs.",
// });
Validations.of(app).addPlugins(new AwsSolutionsChecks(app));
