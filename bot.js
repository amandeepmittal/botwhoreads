/*
  TASKS this bot can do:
  - Retweet (every 3 minutes)
  - THANKYOU Reply to the followers (when followed)
  - Favorite a tweet (every 30 minutes)
  - Randomly Follow Who Follows (every 1 hour)
  - Randomly Unfollow (every 10 hours)
  - Recommends a Book (ask #recommendbook)
*/

// Dependencies =========================
var
  twit = require('twit'),
  config = require('./config'),
  books = require('./books');

var Twitter = new twit(config);

// QUERY qString
var qString = '#kindle OR #book OR #reading OR #AmReading OR #WritingTip OR #YA OR #RomanceWriter OR #IndieAuthors OR @NYTimesBooks OR @ElectricLit OR @LITCHAT OR #LitChat OR @MAUDNEWTON OR @BOOKRIOT OR @GUARDIANBOOKS OR @THE_MILLIONS OR @pageturner OR #AmWriting OR #AmEditing OR #reader OR #writers OR #Bookfession OR #Literature OR #WomensFiction OR #Poetry OR #AuthorRT OR @HuffPostBooks'

// Welcome Console Message
console.log("BotWhoReads Welcome to Twitter.");

// STREAM API for interacting with a USER =======
// set up a user stream
var stream = Twitter.stream('user');

// REPLY-FOLLOW BOT ============================
// what to do when someone follows you?
stream.on('follow', followed);

// ...trigger the callback
function followed(event) {
  console.log('Follow Event now RUNNING');
  // get USER's twitter handler (screen name)
  var
    name = event.source.name,
    screenName = event.source.screen_name;
  // function that replies back to every USER who followed for the first time
  tweetNow('@' + screenName + ' Thank you. What are you reading today?');
}

// function definition to tweet back to USER who followed
function tweetNow(tweetTxt) {
  var tweet = {
    status: tweetTxt
  }
  Twitter.post('statuses/update', tweet, function (err,data, response) {
    if(err){
      console.log("Cannot Reply to Follower. ERROR!");
    }
    else{
      console.log('Reply to follower. SUCCESS!');
    }
  });
}

// RETWEET BOT ===============================
// find latest tweet according to the query defined in params
var retweet = function() {
  var params = {
    q: qString,
    result_type: 'recent',
    lang: 'en'
  }
  // for more parameters options, see: https://dev.twitter.com/rest/reference/get/search/tweets

  Twitter.get('search/tweets', params, function (err,data) {
    // if no errors
    if(!err){
      // grab ID of tweet to retweet
      var retweetId = data.statuses[0].id_str;
      // Tell Twitter to retweet
      Twitter.post('statuses/retweet/:id', {
        id: retweetId
      }, function (err,response) {
        if(response){
          console.log('Retweet. SUCCESS!');
        }
        // if error while retweet
        if(err){
          console.log('While Retweet. ERROR!...Maybe Duplicate Tweet');
        }
      });
    }
    // if unable to search a tweet
    else{
      console.log('Cannot Search Tweet. ERROR!');
    }
  });
}
// grab & retweet ASAP as program is running
retweet();
// retweet every 10 minutes
setInterval(retweet, 600000);

// FAVORITE BOT ==============================
// find a random tweet and 'favorite' it
var favoriteTweet = function () {
  var params = {
    q          : qString,
    result_type: 'recent',
    lang       : 'en'
  }
  // for more parameters, see: https://dev.twitter.com/rest/reference

  // find a tweet
  Twitter.get('search/tweets', params, function (err,data) {
    // find tweets randomly
    var tweet = data.statuses;
    var randomTweet = ranDom(tweet);    //pick a random tweet

      //if random tweet is found
      if(typeof randomTweet != 'undefined'){
        // Tell Twitter to 'favorite' it
        Twitter.post('favorites/create', {id: randomTweet.id_str}, function (err,response) {
          // if error while 'favorite'
          if(err){
            console.log('Cannot Favorite. ERROR!');
          }
          else{
            console.log('Favorite Done. SUCCESS!');
          }
        });
      }
  });
}
// grab & 'favorite' a tweet ASAP program is running
favoriteTweet();
// 'favorite' a tweet every 1 hour
setInterval(favoriteTweet, 3600000);

// FOLLOW THE FOLLOWER BOT=============================
var mingle = function () {
  // GET followers ID
  Twitter.get('followers/ids', function (err,data) {
    if(err){
      // if error while getting any follower
      console.log('Cannot Find Follower. ERROR!');
    }
    // GET a follower randomly
    var
      follower = data.ids,
      randomFollower = ranDom(follower);
    Twitter.get('friends/ids', {user_id: randomFollower}, function (err,response) {
      // if error while following any follower
      if(err){
        console.log('Cannot Follow Anyone. ERROR!');
      }
      // friendship with a random follower
      var
        friend = response.ids,
        beFriend = ranDom(friend);
      // befriend, make friends
      Twitter.post('friendships/create', {id: beFriend}, function (err,response) {
        // if error while making friends
        if(err){
          console.log('Cannot BeFriend Anyone. ERROR!');
        }
        else{
          console.log('You are now frineds with someone. SUCCESS!');
        }
      });
    });
  });
}
// grab and befriend a follower ASAP
mingle();
// 'friend' a follower every 1 hour
setInterval(mingle, 3600000);

// UNFOLLOW BOT ========================================
var unfollow = function () {
  // GET Followers ID
  Twitter.get('followers/ids', function (err, data) {
    if(err){
      // if error while getting any follower
      console.log('Cannot Find Follower. ERROR!');
    }
    // Get a Follower randomly
    var
      follower = data.ids,
      randomUnfollow = ranDom(follower);
    Twitter.get('friends/ids', {user_id: randomUnfollow}, function (err, response) {
      // if error whle unfollowing
      if(err){
        console.log('Cannot Unfollow anyone. ERROR!');
      }
      // unfollow that friend
      var
        friend = response.ids,
        unFriend = ranDom(friend);

      Twitter.post('friendships/destroy', {id: unFriend}, function (err,response) {
        // if error while unfollow
        if(err){
          console.log("Cannot Unfollow right now. ERROR!");
        }
        else{
          console.log('Unfollowed. SUCCESS!');
        }
      });
    });
  });
}
// grab & unfollow
// unfollow();
// 'unfollow' a user every 1 hour
setInterval(unfollow, 3600000)

// function to generate random tweet/follower/friend ==========
function ranDom(arr) {
  var index = Math.floor(Math.random()*arr.length);
  return arr[index];
};

// BOT INNERACTIVITY: Book Recommendation ===================================
// track own twitter handle
var interActiveStream = Twitter.stream('statuses/filter', {track: '#recommendbook'});

// open a stream
interActiveStream.on('tweet', function (tweet) {
  var
    personName = tweet.user.screen_name,
    book = randomBook(books);

  // function that replies back to  USER  who asked for recommendation
  tweetBack('@' + personName + ' How about: ' + book);
});

// function definitation of tweetBack() for USER asking recommendation
function tweetBack(text) {
  var tweet = {
    status: text,
    id: randomBook
  }
  // tweet back recommendation
  Twitter.post('statuses/update', tweet, function (err,data, response) {
    if(err){
      console.log("Cannot Recommend. ERROR!");
    }
    else{
      console.log('Recommended a book. SUCCESS!');
    }
  });
}

// functions to pick random books from books
function randomBook (books) {
  var index = Math.floor(Math.random()*books.length);
  return books[index];
}

// EOP =============================
