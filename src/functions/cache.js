const userCache = new Map();

export default userCache;

//This cache is used for caching users who are currently being processed in the events of the bot
//It's presently used for the messageReactionAdd event
//There weren't found any bugs or cases where would be cache needed for also the messageReactionRemove event
//This solution prevents users from (spamming) running 2 events at a time