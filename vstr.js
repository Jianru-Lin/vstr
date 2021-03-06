try {
    var node_ver = process.versions.node
    if (node_ver) {
        module.exports = vstr
    }
}
catch(err) {
    // not node.js environment, ignore error
}

// template string function
// example:
//     vstr('http://${host}:${port}/index.html', {host: 'www.target.com', port: '8080'})
//     -> http://www.target.com:8080/index.html
function vstr(str, data, option) {

    // data can be null or undefined
    // we just treat it as an empty object
    if (data === undefined || data === null) {
        data = {}
    }

    checkArgs()
    init()
    return level_0(str, data2f(data))

    function checkArgs() {
        if (typeof str !== 'string') {
            throw new Error('[vstr] invalid argument, type of str must be string')
        }
        if (typeof data !== 'object' || data === null) {
            throw new Error('[vstr] invalid argument, type of data must be object')
        }
        // TODO check option
    }

    function level_0(str, f) {

        var pattern = /\${([^}]+)}/g
        return str.replace(pattern, function(g0, g1, pos, src) {
            var val = f(g1)
            if (val === undefined || val === null) {
                return ''
            }
            else if (typeof val !== 'string') {
                throw new Error('[level_0] type of value returned from f(' + g1 + ') is not string')
            }
            else {
                return val
            }
        })

        function checkArgs() {
            if (typeof str !== 'string') {
                throw new Error('[level_0] invalid argument, type of str must be string')
            }
            if (typeof f !== 'function') {
                throw new Error('[level_0] invalid argument, type of f must be function')
            }
        }
    }

    function data2f(data) {
        if (typeof data !== 'object' || data === null) {
            throw new Error('[data2f] invalid argument, typeof data must be object')
        }
        return queryValue
        
        function queryValue(expText) {
            filterExp = parseFilterExpression(expText)
            var value = executeFilterExpression(filterExp)
            // convert value to string
            return value === null || value === undefined ? '' : (value + '')

            function parseFilterExpression(expText) {
                // split by |
                var parts = expText.split('|')
                // clear useless whitespace of every part
                parts = parts.map(function(part) {
                    return part.trim()
                })
                // return result
                if (parts.length > 1) {
                    return {
                        name: parts[0],
                        filterNameList: parts.slice(1)
                    }
                }
                else {
                    return {
                        name: parts[0],
                        filterNameList: []
                    }
                }
            }

            function executeFilterExpression(filterExp) {
                // retrive the raw value
                var rawValue = getValue(data, filterExp.name)
                // invoke filter function on rawValue
                var value = rawValue
                filterExp.filterNameList.forEach(function(filterName) {
                    // ignore empty filterName
                    if (!filterName) {
                        return
                    }
                    var filterFun = vstr.filterMap[filterName]
                    if (typeof filterFun !== 'function') {
                        throw new Error('[executeFilterExpression] filter function not found: ' + filterName)
                    }
                    // try invoke the filterFun
                    try {
                        value = filterFun(value)
                    }
                    catch (err) {
                        throw new Error('[executeFilterExpression] error throwed from filter function ' + filterName + ', ' + err.toString())
                    }
                })

                // return result
                return value

                function getValue(obj, propLink) {
                    if (propLink.indexOf('.') === -1) {
                        return obj[propLink]
                    }
                    else {
                        var result = obj
                        propLink = propLink.split('.')
                        try {
                            propLink.forEach(function(prop) {
                                result = result[prop]
                            })
                        }
                        catch (err) {
                            // tolerate error
                            return ''
                        }
                        return result
                    }
                }
            }
        }

    }

    function init() {
        if (vstr.inited) {
            return
        }
        vstr.inited = true
        vstr.filterMap = {
            uri: encodeURI,
            uricom: encodeURIComponent,
            json: function(value) {
                // null is ok, but undefined is rejected
                if (value === undefined) {
                    throw new Error('[json filter] value can not be undefined')
                }
                return JSON.stringify(value)
            },
            query: function(value) {
                if (value === undefined || value === null) {
                    return ''
                }
                else if (typeof value !== 'object') {
                    throw new Error('[json filter] value is provided but it\'s type is not object')
                }
                else {
                    var obj = value
                    var list = []
                    for (var name in obj) {
                        if (typeof obj[name] === 'string') {
                            list.push(encodeURIComponent(name) + '=' + encodeURIComponent(obj[name]))
                        }
                    }
                    if (list.length > 0) {
                        return list.join('&')
                    }
                    else {
                        return ''
                    }
                }
            },
            upper: function(value) {
                if (value === undefined || value === null) {
                    return ''
                }
                else if (typeof value !== 'string') {
                    throw new Error('[upper filter] value is provided but it\'s type is not string')
                }
                else {
                    return value.toUpperCase()
                }
            },
            lower: function(value) {
                if (value === undefined || value === null) {
                    return ''
                }
                else if (typeof value !== 'string') {
                    throw new Error('[lower filter] value is provided but it\'s type is not string')
                }
                else {
                    return value.toLowerCase()
                }
            }
        }
    }
}