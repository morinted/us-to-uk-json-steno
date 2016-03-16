import fs from 'fs'
import { parseString } from 'xml2js'

// All queries in XML
const xmlQueries =
  fs.readFileSync('./assets/queries.txt', 'utf8')
    .split(/(\r\n|\n){2}/g)

// Array of stop words (strings)
const stopWords =
  fs.readFileSync('./assets/stopwords.txt', 'utf8')
    .split('\n')

// Array of { time: num ms, tweet: 'string' }
const tweets =
  fs.readFileSync('./assets/tweets.txt', 'utf8')
    .split('\n')
    .map(tweet => tweet.split('\t'))
    .map(([ time, tweet ]) => ({ time, tweet }))
    .filter(tweet => tweet.tweet)

console.info(`Loaded ${tweets.length} tweets, ${stopWords.length} stop words,
              and ${xmlQueries.length} lines in the queries file.`)

// Do everything in here:
async function main () {
  // Parse all the XML strings
  const queryPromises =
    xmlQueries.map(query =>
      (new Promise((resolve, reject) => {
        parseString(query, (err, result) => {
          if (err) reject(err)
          resolve(result)
        })
      }))
    )

//function for tokenization and stopword removal
  const filterSentence = sentence => sentence.trim()
      .replace(/[^a-zA-Z ]/g, '').toLowerCase()
      .split(' ')
      .filter(word => word && stopWords.indexOf(word) < 0)

  console.info('Processing queries from XML to JSON, removing stop words…')
  const queries =
    (await Promise.all(queryPromises)) // parsing...
      .filter(x => x) // gets rid of null entries
      .map(x => x.top) // remove the <top> tag
      .map(({ num, title, querytime, querytweettime }) => (
          // Get rid of spacing for all the properties
          { num: parseInt(num[0].trim().substring(10), 10) // MB048
          , tokens: filterSentence(title[0])
          , time: querytime[0].trim()
          , tweetTime: querytweettime[0].trim()
          }
        )
      )

  console.info(`There are ${queries.length} valid queries.`)

  console.info('Filtering stop words from tweets…')
  const filteredTweets =
    tweets.map(({ time, tweet }) => (
      { time
      , tweet: filterSentence(tweet)
      }
    ))
  console.info('Building index for tweet vocabulary…')
  const tokens =
    filteredTweets.reduce((index, { time, tweet }) => {
      tweet.forEach(word => {
        if (!index[word]) {
          index[word] = { [time]: 1 }
        } else if (index[word][time]) {
          index[word][time] += 1
        } else {
          index[word][time] = 1
        }
      })
      return index
    }, {})
  console.info(`Vocabulary has ${Object.keys(tokens).length} words`)
  // Array of { document id (tweettime): num words }
  const wordsInTweets =
    filteredTweets.reduce((twitterWords, { time, tweet }) => {
      twitterWords[time] = tweet.length
      return twitterWords
    }, {})
  console.log('Writing files…')
  fs.writeFile('./assets/queries.json', JSON.stringify(queries), 'utf8', e => {
    if (e) throw e
    console.log('Successfully wrote queries.json')
  })
  fs.writeFile('./assets/index.json', JSON.stringify(tokens), 'utf8', err => {
    if (err) throw err
    console.log('Successfully wrote index.json')
  })
  fs.writeFile('./assets/tweets.json', JSON.stringify(tweets), 'utf8', err => {
    if (err) throw err
    console.log('Successfully wrote tweets.json')
  })
  fs.writeFile('./assets/words_per_tweet.json',
    JSON.stringify(wordsInTweets), 'utf8', err => {
      if (err) throw err
      console.log('Successfully wrote words_per_tweet.json')
    })
}

main()
