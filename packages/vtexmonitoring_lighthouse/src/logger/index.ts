/* eslint-disable @typescript-eslint/ban-ts-ignore */
/* eslint-disable no-console */
import * as Color from 'colors/safe'

export default class Logger {
  private prefix: any
  private color: string
  constructor(prefix = '') {
    this.prefix = prefix
    this.color = this.getRandomColor()
  }

  public log(string: string) {
    // @ts-ignore
    console.log(Color[this.color](`${this.prefix}${string}`))
  }

  private getRandomColor() {
    const set = [
      'red',
      'green',
      'yellow',
      'blue',
      'magenta',
      'cyan',
      'white',
      'gray',
      'grey',
    ]
    return set[Math.floor(Math.random() * set.length)]
  }
}
