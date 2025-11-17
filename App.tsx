import { Text, StyleSheet, View } from 'react-native'
import React, { Component } from 'react'
import "./global.css"

export default class App extends Component {
  render() {
    return (
      <View className='bg-red-500 flex-1 justify-center items-center'>
        <Text>App</Text>
      </View>
    )
  }
}

const styles = StyleSheet.create({})