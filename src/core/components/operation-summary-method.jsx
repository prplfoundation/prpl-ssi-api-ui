import React, { PureComponent } from "react"
import PropTypes from "prop-types"
import { Iterable } from "immutable"

export default class OperationSummaryMethod extends PureComponent {

  static propTypes = {
    operationProps: PropTypes.instanceOf(Iterable).isRequired,
    method: PropTypes.string.isRequired,
  }

  static defaultProps = {
    operationProps: null,
  }
  render() {

    let {
      method,
    } = this.props

    let fullmethod = method.toUpperCase();
    let last_dot_position = fullmethod.lastIndexOf(".");

    return (
      <span className="opblock-summary-method">{fullmethod.substring(last_dot_position + 1, fullmethod.length)}</span>
    )
  }
}
