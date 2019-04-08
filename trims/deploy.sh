#!/bin/bash

if [ -z $1 ]; then
    echo "Please provide lowerCaseStack"
    echo "Example: ./deploy.sh diego"
    exit
fi

function zipFile {
    echo "lambda/`basename $1`"
}

stackName=$1
cfnStackName=$(echo "$stackName" | tr '[:upper:]' '[:lower:]')-sitemap
timestamp=$stackName-`date '+%Y%m%d%H%M%S'`
s3Bucket="serverless-sitemap-dist"
templateFile="trims.yaml"
region="eu-west-1"

trimsSitemapZip="/tmp/trims-sitemap-$timestamp.zip"
zip -qr $trimsSitemapZip . -x ".*"
aws s3 cp $trimsSitemapZip --region $region s3://$s3Bucket/artifacts/
rm $trimsSitemapZip

# Create/Update stack
echo "Rebuilding stack"
aws cloudformation describe-stacks --stack-name $cfnStackName --output text --query 'Stacks[0].StackName' --region $region > /dev/null
if [ $? -eq 0 ]; then
  cfnCommand=update-stack
  cfnWait=stack-update-complete
else
  echo Please ignore the previous message
  cfnCommand=create-stack
  cfnWait=stack-create-complete
fi

aws cloudformation $cfnCommand --stack-name $cfnStackName --capabilities CAPABILITY_IAM --template-body file://$templateFile --region $region --parameters \

ParameterKey=StackName,ParameterValue=$stackName \
ParameterKey=SearchDataZip,ParameterValue=trimsSitemapZip

aws cloudformation wait $cfnWait --stack-name $cfnStackName --region $region
exitCode=$?
if [ $exitCode -ne 0 ]; then exit; fi
