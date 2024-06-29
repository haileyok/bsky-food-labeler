# Bluesky Food Labeler

This is a simple example of a labeler that can be configured to apply labels based on the results of a ML model. It is
inspired by [Xblock](https://github.com/aendra-rininsland/xblock) and uses `@xenova/transformers`.

## Pre-requisites

You should have a labeler account configured on Bluesky. For more information, see [Bluesky's Ozone documentation](https://github.com/bluesky-social/ozone).

You should also have a Redis server running.

## Configuration

```
# Bsky credentials
BSKY_IDENTIFIER=
BSKY_PASSWORD=

# Include external embeds
INCLUDE_EXTERNAL_EMBEDS=true

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Queue settings
# Based on machine specs, model, number of posts you expect to process per second, etc. you will want to configure this
# accordingly.
MAX_PER_BATCH=3
```

## Implementing your own

Most of the logic is inside of `src/DetectFood.ts`. You can adjust the model that is used and thresholds for applying
labels here - all inside of `detect()`. You should also add the labels that you have added to your Ozone instance inside
of `src/types.ts`. You should not need to modify anything else for most cases, but your mileage may vary.

## Firehose Disconnects

Generally, I set up labelers to just restart every hour via a cron job. This fairly well ensures that you don't
get disconnected from the firehose. Sure, you could implement this logic in the code too, but I am quite lazy.
