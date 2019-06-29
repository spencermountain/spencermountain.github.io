exports.weighted = function(obj) {
  let sum = 0
  const accumulated = []
  Object.keys(obj).forEach(k => {
    sum += obj[k] || 0
    accumulated.push([k, sum])
  })
  const r = Math.round(Math.random() * sum)
  const choice = accumulated.find(c => r <= c[1]) || []
  return choice[0]
}

exports.choose = function(arr) {
  const r = Math.round(Math.random() * (arr.length - 1))
  return arr[r]
}
