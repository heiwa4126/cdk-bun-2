import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CdkBun2Stack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		const fn = new NodejsFunction(this, "lambda1", {
			entry: "lambda/app1/index.ts",
			handler: "handler",
			runtime: lambda.Runtime.NODEJS_24_X,
			bundling: {
				minify: true, // minifyオプションを有効にする
				format: OutputFormat.ESM, // ES Modulesを使用する
				// externalModules: ["aws-sdk"], // AWS SDKは外部モジュールとして扱う（デフォルト）
			},
		});
		new logs.LogGroup(this, "lambda1LogGroup", {
			logGroupName: `/aws/lambda/${fn.functionName}`,
			removalPolicy: cdk.RemovalPolicy.DESTROY,
			retention: logs.RetentionDays.ONE_WEEK,
		});

		// Lambda Function URL版
		const fnUrl = fn.addFunctionUrl({
			authType: lambda.FunctionUrlAuthType.NONE,
			cors: {
				// テストなんで極甘で
				allowedMethods: [lambda.HttpMethod.ALL],
				allowedOrigins: ["*"],
			},
		});

		new cdk.CfnOutput(this, "fnUrl", {
			value: fnUrl.url,
		});
	}
}
