import axios from 'axios'
import fs from 'fs'
import cheerio from 'cheerio'
import minimist from 'minimist'

const argv = minimist(process.argv.slice(2))

const repositoryName = argv.url.split('.com/')[1].replace(/\//g, "-")
const fileName = `${repositoryName}.json`

const file = fs.createWriteStream(fileName)
file.write('[')

function scrapByUrl(url) {
  return axios.get(url).then((res) => {
    const $ = cheerio.load(res.data)

    $('.Box-row').each((i, elem) => {
      const stars = $(elem).find('.octicon-star')[0].nextSibling.nodeValue
      const link = $(elem).find('a').eq(1).attr('href')

      const repository = { link, stars: Number(stars.trim()), scrapUrl: url }

      file.write(JSON.stringify(repository))
      file.write(',')
    })

    const nextButton = $('a.BtnGroup-item:contains("Next")')

    if (nextButton.length === 1) {
      return scrapByUrl(nextButton.attr('href'))
    }
  })
}

await scrapByUrl(`${argv.url}/network/dependents`)

file.write(JSON.stringify({}))
file.write(']')
file.end()

console.log('complete parsing')

fs.readFile(fileName, (error, data) => {
  if (error) {
    console.log(error)
    return
  }
  const parsedData = JSON.parse(data)

  parsedData.sort((a, b) => Number(b.stars) - Number(a.stars))

  fs.writeFile(fileName, JSON.stringify(parsedData, null, 2), (err) => {
    if (err) {
      console.log('Failed to write sorted data to file')
      return
    }
    console.log('Sorted file successfully')
  })
})