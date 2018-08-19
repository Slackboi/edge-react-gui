// @flow

// import _ from 'lodash'
import { bns } from 'biggystring'

import React, { Component } from 'react'
import { TouchableHighlight, View } from 'react-native'
import slowlog from 'react-native-slowlog'
import { connect } from 'react-redux'
import { intl } from '../../../../locales/intl.js'
import type { CustomTokenInfo, GuiDenomination } from '../../../../types.js'
import type { Dispatch, State } from '../../../ReduxTypes'
import { decimalOrZero, DIVIDE_PRECISION, getWalletDefaultDenomProps, calculateFiatFromCryptoCurrency, cutOffText, getFiatSymbol, findDenominationSymbol, truncateDecimals, formatNumber } from '../../../utils.js'
import { getDisplayDenomination, getExchangeDenomination } from '../../Settings/selectors.js'
import Text from '../FormattedText'
import { styles, stylesRaw } from './WalletListRowStyle.js'

export type WalletListRowOwnProps = {
  wallet: any
  // onPress: Function,
}

export type WalletListRowStateProps = {}

export type WalletListRowDispatchProps = {}

export type WalletListRowProps = WalletListRowOwnProps & WalletListRowStateProps & WalletListRowDispatchProps

export type WalletListRowState = {
  displayDenomination: GuiDenomination,
  exchangeDenomination: GuiDenomination,
  customTokens: Array<CustomTokenInfo>,
  fiatSymbol: string,
  isWalletFiatBalanceVisible: boolean,
  fiatBalance: string
}

export class WalletListRowComponent extends Component<WalletListRowProps, WalletListRowState> {
  constructor (props: WalletListRowProps) {
    super(props)
    slowlog(this, /.*/, global.slowlogOptions)
  }

  render () {
    const { wallet, onPressSelectWallet, settings } = this.props
    const { currencyCode, name, id, enabledTokens, nativeBalances } = wallet
    const denomination = wallet.allDenominations[currencyCode]
    const denomProps = getWalletDefaultDenomProps(wallet, settings, currencyCode)
    let multiplier
    if (denomination) {
      multiplier = denomination[settings[currencyCode].denomination].multiplier
    } else {
      const customDenom = _.find(settings.customTokens, item => item.currencyCode === currencyCode)
      if (customDenom && customDenom.denominations && customDenom.denominations[0]) {
        multiplier = customDenom.denominations[0].multiplier
      } else {
        return // let it blow up. It shouldn't be attempting to display
      }
    }

    // need to crossreference tokensEnabled with nativeBalances
    const enabledNativeBalances = {}

    for (const prop in nativeBalances) {
      if (prop !== currencyCode && enabledTokens.includes(prop)) {
        enabledNativeBalances[prop] = nativeBalances[prop]
      }
    }
    const cryptoSymbol = denomination.symbol
    const preliminaryCryptoAmount = truncateDecimals(bns.div(wallet.primaryNativeBalance, multiplier, DIVIDE_PRECISION), 6)
    const finalCryptoAmount = intl.formatNumber(decimalOrZero(preliminaryCryptoAmount, 6)) // check if infinitesimal (would display as zero), cut off trailing zeroes

    return (
      <View style={[{ width: '100%' }]}>
        <TouchableHighlight style={[styles.rowContainer]} underlayColor={stylesRaw.underlay.color} onPress={() => onPressSelectWallet(id, currencyCode)}>
          <View style={[{ width: '100%', flexDirection: 'row', justifyContent: 'space-between' }]}>
            <View style={[styles.rowLeft]}>
              <Text style={[styles.rowNameText]} numberOfLines={1}>
                {cutOffText(name, 34)}
              </Text>
            </View>
            <View style={[styles.rowRight]}>
              <View style={[styles.rowRightCryptoWrap]}>
                <Text style={[styles.rowRightCrytoText]}>{finalCryptoAmount} {cryptoSymbol || ''}</Text>
              </View>
              <View style={[styles.rowRightFiatWrap]}>
                <Text style={[styles.rowRightFiatText]}>Doody</Text>
              </View>
            </View>
          </View>
        </TouchableHighlight>
      </View>
    )
  }
}

const mapStateToProps = (state: State, ownProps: WalletListRowOwnProps): WalletListRowStateProps => {
  const displayDenomination = getDisplayDenomination(state, ownProps.wallet.currencyCode)
  const exchangeDenomination = getExchangeDenomination(state, ownProps.wallet.currencyCode)
  const settings = state.ui.settings
  const fiatSymbol = getFiatSymbol(settings.defaultFiat) || ''
  const customTokens = state.ui.settings.customTokens
  const isWalletFiatBalanceVisible = state.ui.settings.isWalletFiatBalanceVisible
  const fiatBalance = calculateFiatFromCryptoCurrency(ownProps.wallet, state)
  return {
    displayDenomination,
    exchangeDenomination,
    customTokens,
    fiatSymbol,
    isWalletFiatBalanceVisible,
    fiatBalance,
    settings
  }
}
const mapDispatchToProps = (dispatch: Dispatch): WalletListRowDispatchProps => {
  return {}
}

export const WalletListRowConnector = connect(mapStateToProps, mapDispatchToProps)(WalletListRowComponent)