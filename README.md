# cdk-bun-2

[cdk-bun-1](https://github.com/heiwa4126/cdk-bun-1) が
サンプルとしてはちょっと無理、な感じになってきたので、別レポジトリを作りました。

## 動かし方

AWS Lambda Functions URLs を 1 個デプロイする。
中身は "hello world".

```sh
bun ci

# ローカルで最初の動作確認
bun run list
bun run synth # cdk.out 以下に CFn が合成される

# 編集後テスト
bun run test

# デプロイ
aws login
bun run bootstrap # 1回だけ実行。たまに更新されるらしい
bun run deploy
#-- URLが表示されるのでブラウザなどで開く
bun run curl  # curl と jq があれば動く

# おわったら消す
bun run destroy
```

### スタック名サフィックス

環境変数 `STACK_SUFFIX` を設定すると、スタック名の末尾にサフィックスが付きます。

[Bun は自動で .env を読む](https://bun.com/docs/runtime/environment-variables#setting-environment-variables)
ので、`.env` に書くといいでしょう。

```sh
# .env
STACK_SUFFIX=dev
```

- `STACK_SUFFIX` が未設定または空文字 ⇒ スタック名: `CdkBun2Stack`
- `STACK_SUFFIX=dev` ⇒ スタック名: `CdkBun2Stack-dev`

## メモ

### ロググループの自動生成をやめる

`cdk.json` の
`"@aws-cdk/aws-lambda:useCdkManagedLogGroup": false`
で、ロググループの自動生成を止めています。
命名規則やライフサイクル、削除ポリシーを制御したいので。

参考:

- [❗NOTICE (aws-lambda): Lambda cdk managed log group duplicates · Issue #34612 · aws/aws-cdk](https://github.com/aws/aws-cdk/issues/34612)

### cdk-nag (v3)

小細工して AwsSolutions-IAM4 をサプレスしなくてもいいようにしました。

### CDKのディレクトリ

ルートに lib/ や bin/ があるのが気に入らない(CDK 専用のくせに)ので、
全部 cdk/ にうつした。
ちゃんと動くので、これからはこうする。
