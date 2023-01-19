# Serverless Plugin Carbonless

Run your AWS serverless application in the region with the lowest carbon intensity.

## Why

Serverless is already a great way to reduce your carbon emissions, but we can do even better! Every 4,434 metric tons of carbon dioxide removed from our atmosphere could save one life between 2020-2100*. Vulnerable communities across the world are at risk from climate change. By running your serverless applications in the regions with the lowest carbon intensity, you can have a hugely positive impact on people and the planet!

*Bressler, R.D. The mortality cost of carbon. Nat Commun 12, 4467 (2021).

## Usage

Add Carbonless to your project:

```
npm install carbonless
```

Then inside your project's `serverless.yml` file add `carbonless` to your list of plugins:

```
plugins:
  - carbonless
```

Carbonless changes the default region from `us-east-1` to the region with the lowest carbon intensity. It will be overriden if you manually add a region to your `serverless.yml` or if you include region as a deploy option.

To use Carbonless, please do not include the following in your `serverless.yml`:

```
provider:
  name: aws
  region: eu-west-1 // Specifing a region means that Carbonless will not be used
```

Also do not include region when you deploy:

```
# Specifing a region means that Carbonless will not be used
sls deploy --region eu-west-1 
```

If your `serverless.yml` file doesn't specify a region, and you don't specify a region when you deploy your serverless application, then Carbonless will select the greenest region for you using forecast data provided by https://www.watttime.org/

```
The region with the lowest carbon intensity is eu-west-3
Carbonless plugin has changed region to eu-west-3
```

## Support

This project has been supported by the Adora Foundation (https://adorafoundation.org/) as part of it's Incubation Lab. Thanks for all of the help and support!