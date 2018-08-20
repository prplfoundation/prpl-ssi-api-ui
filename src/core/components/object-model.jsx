import React, { Component, } from "react"
import PropTypes from "prop-types"
import { List } from "immutable"
import ImPropTypes from "react-immutable-proptypes"

const braceOpen = "{"
const braceClose = "}"

class EventComponent extends Component {
  static propTypes = {
    data: PropTypes.object.isRequired
  }

  render(){

    let { events } = this.props

    let jsEvents = events.toJS()

    let mevents = Object.keys(jsEvents).map((key, index) => {
        const ev = jsEvents[key]
        return (
          <tr key={key}>
            <td>
              {key}
            </td>
            <td>
              {ev.description}
            </td>
            <td>
              <div className="highlight-code">
                <pre className="example microlight">
                  <span>
                    {ev["content"]["application/json"]["example"]}
                  </span>
                </pre>
              </div>
            </td>
          </tr>
          )
        
      });

    return (
      <div>
      <br/>
      <br/>
      <span className="model-title"> Events </span>
        <table>
          <thead>
            <tr className="responses-header">
              <td className="col col_header response-col_status">Code</td>
              <td className="col col_header response-col_description">Description</td>
              <td className="col col_header response-col_description">Example</td>
            </tr>
          </thead>
          <tbody>
            {mevents}
          </tbody>
        </table>
        
      </div>
    )
  }
}



export default class ObjectModel extends Component {
  static propTypes = {
    schema: PropTypes.object.isRequired,
    getComponent: PropTypes.func.isRequired,
    getConfigs: PropTypes.func.isRequired,
    expanded: PropTypes.bool,
    onToggle: PropTypes.func,
    specSelectors: PropTypes.object.isRequired,
    name: PropTypes.string,
    displayName: PropTypes.string,
    isRef: PropTypes.bool,
    expandDepth: PropTypes.number,
    depth: PropTypes.number,
    specPath: ImPropTypes.list.isRequired
  }

  render(){
    let { schema, name, displayName, isRef, getComponent, getConfigs, depth, onToggle, expanded, specPath, ...otherProps } = this.props
    let { specSelectors,expandDepth } = otherProps
    const { isOAS3 } = specSelectors

    if(!schema) {
      return null
    }

    const { showExtensions } = getConfigs()

    let description = schema.get("description")
    let properties = schema.get("properties")
    let events = schema.get("events")
    let additionalProperties = schema.get("additionalProperties")
    let title = schema.get("title") || displayName || name
    let requiredProperties = schema.get("required")

    const JumpToPath = getComponent("JumpToPath", true)
    const Markdown = getComponent("Markdown")
    const Model = getComponent("Model")
    const ModelCollapse = getComponent("ModelCollapse")

    const JumpToPathSection = () => {
      return <span className="model-jump-to-path"><JumpToPath specPath={specPath} /></span>
    }
    const collapsedContent = (<span>
        <span>{ braceOpen }</span>...<span>{ braceClose }</span>
        {
          isRef ? <JumpToPathSection /> : ""
        }
    </span>)

    const anyOf = specSelectors.isOAS3() ? schema.get("anyOf") : null
    const oneOf = specSelectors.isOAS3() ? schema.get("oneOf") : null
    const not = specSelectors.isOAS3() ? schema.get("not") : null

    const titleEl = title && <span className="model-title">
      { isRef && schema.get("$$ref") && <span className="model-hint">{ schema.get("$$ref") }</span> }
      <span className="model-title__text">{ title }</span>
    </span>

    return <span className="model">
      <ModelCollapse
        modelName={name}
        title={titleEl}
        onToggle = {onToggle}
        expanded={ expanded ? true : depth <= expandDepth }
        collapsedContent={ collapsedContent }>

         <span className="brace-open object">{ braceOpen }</span>
          {
            !isRef ? null : <JumpToPathSection />
          }
          <span className="inner-object">
            {
              <table className="model"><tbody>
              {
                !description ? null : <tr style={{ color: "#666", fontStyle: "italic" }}>
                    <td>description:</td>
                    <td>
                      <Markdown source={ description } />
                    </td>
                  </tr>
              }
              {
                !(properties && properties.size) ? null : properties.entrySeq().map(
                    ([key, value]) => {
                      let isDeprecated = isOAS3() && value.get("deprecated")
                      let isRequired = List.isList(requiredProperties) && requiredProperties.contains(key)
                      let propertyStyle = { verticalAlign: "top", paddingRight: "0.2em" }
                      if ( isRequired ) {
                        propertyStyle.fontWeight = "bold"
                      }

                      return (<tr key={key} className={isDeprecated && "deprecated"}>
                        <td style={ propertyStyle }>
                          { key }{ isRequired && <span style={{ color: "red" }}>*</span> }
                        </td>
                        <td style={{ verticalAlign: "top" }}>
                          <Model key={ `object-${name}-${key}_${value}` } { ...otherProps }
                                 required={ isRequired }
                                 getComponent={ getComponent }
                                 specPath={specPath.push("properties", key)}
                                 getConfigs={ getConfigs }
                                 schema={ value }
                                 depth={ depth + 1 } />
                        </td>
                      </tr>)
                    }).toArray()
              }
              {
                // empty row befor extensions...
                !showExtensions ? null : <tr>&nbsp;</tr>
              }
              {
                !showExtensions ? null :
                  schema.entrySeq().map(
                    ([key, value]) => {
                      if(key.slice(0,2) !== "x-") {
                        return
                      }

                      const normalizedValue = !value ? null : value.toJS ? value.toJS() : value

                      return (<tr key={key} style={{ color: "#777" }}>
                        <td>
                          { key }
                        </td>
                        <td style={{ verticalAlign: "top" }}>
                          { JSON.stringify(normalizedValue) }
                        </td>
                      </tr>)
                    }).toArray()
              }
              {
                !additionalProperties || !additionalProperties.size ? null
                  : <tr>
                    <td>{ "< * >:" }</td>
                    <td>
                      <Model { ...otherProps } required={ false }
                             getComponent={ getComponent }
                             specPath={specPath.push("additionalProperties")}
                             getConfigs={ getConfigs }
                             schema={ additionalProperties }
                             depth={ depth + 1 } />
                    </td>
                  </tr>
              }
              {
                !anyOf ? null
                  : <tr>
                    <td>{ "anyOf ->" }</td>
                    <td>
                      {anyOf.map((schema, k) => {
                        return <div key={k}><Model { ...otherProps } required={ false }
                                 getComponent={ getComponent }
                                 specPath={specPath.push("anyOf", k)}
                                 getConfigs={ getConfigs }
                                 schema={ schema }
                                 depth={ depth + 1 } /></div>
                      })}
                    </td>
                  </tr>
              }
              {
                !oneOf ? null
                  : <tr>
                    <td>{ "oneOf ->" }</td>
                    <td>
                      {oneOf.map((schema, k) => {
                        return <div key={k}><Model { ...otherProps } required={ false }
                                 getComponent={ getComponent }
                                 specPath={specPath.push("oneOf", k)}
                                 getConfigs={ getConfigs }
                                 schema={ schema }
                                 depth={ depth + 1 } /></div>
                      })}
                    </td>
                  </tr>
              }
              {
                !not ? null
                  : <tr>
                    <td>{ "not ->" }</td>
                    <td>
                      <div>
                        <Model { ...otherProps }
                               required={ false }
                               getComponent={ getComponent }
                               specPath={specPath.push("not")}
                               getConfigs={ getConfigs }
                               schema={ not }
                               depth={ depth + 1 } />
                      </div>
                    </td>
                  </tr>
              }
              </tbody></table>
          }
        </span>
        <span className="brace-close">{ braceClose }</span>
        {
          !events ? null 
            : <EventComponent events={events}/>
        }
      </ModelCollapse>
    </span>
  }
}
