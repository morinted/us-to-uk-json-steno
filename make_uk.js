import main_dict from './main.json'
import { readFileSync } from 'fs'

// Exceptions, manual definitions.
const staticUk =
  { 'KH*EBG': 'cheque'
  , 'KH*EBGS': 'cheques'
  , 'TKRA*FT': 'draught'
  }

const usWords = readFileSync('wordlists/us', 'utf-8')
  .split('\n')
  .reduce((result, usWord, index) => {
    return Object.assign(result, { [usWord]: index })
  }, {}) // Object: { usWord: indexOfWord }

// Array of UK words (same order, size, index as US words)
const ukWords =
  readFileSync('wordlists/uk', 'utf-8')
    .split('\n')

const ukDictionary =
  Object.assign(
    Object.keys(main_dict).reduce(
      (result, currentKey) => {
        // Get the word from the main dictionary.
        const ploverWord = main_dict[currentKey]
        // See if the US word exists.
        const wordIndex = usWords[ploverWord]
        if (wordIndex) { // It does.
          // Get the UK version
          result[currentKey] = ukWords[wordIndex]
        }
        return result // Next word.
      }, {}
    ), staticUk // Apply overrides.
  )

// Output to console.
console.log(JSON.stringify(ukDictionary, null, 2))
