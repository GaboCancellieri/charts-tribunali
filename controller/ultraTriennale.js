var round =  require('mongo-round')
var tr    = require('./tribunali')
var utils = require('../utils/utils')

//TODO formatClearance debería estar en la vista, no en el controller
function formatUT(data,title){
  //category or "labels" array
  var categoryArray = []

  // values array
  var utArray = []
  var rawNums = []
  var tabData = []
  var labels  = []
  var color = []
  var dynamicColors = function(num) {

    var r = Math.abs(num) % 251;
    var g = Math.abs(num) % 254;
    var b = Math.abs(num) % 253;
    // console.log("r: " + r + " g: " + g + " b: " + b)
    return "rgb(" + r + "," + g + "," + b + ")";
  };
  // data.sort( function(a,b){return a['_id']['anno'] - b['_id']['anno']})
  data.sort((a,b)=>{
    if (a['_id']['anno'] == b['_id']['anno']){
      if (a['_id']['aggregazione'] != null){
        return (a['_id']['aggregazione']>b['_id']['aggregazione']?1:-1);
      }
      else return a['_id']['anno'] - b['_id']['anno']
    }
    else return a['_id']['anno'] - b['_id']['anno']
  })

  for (index in data){
       var doc = data[index]
       var category = doc['_id'].aggregazione
       if (doc['_id'].aggregazione == null) category = 'Totale'
       category = category + ' -- ' + doc['_id'].anno

       var ut = doc['ultraTriennale']
       categoryArray.push(category)
       // console.log(doc)
       utArray.push(parseFloat(ut.toPrecision(3)))
       hash = utils.hashCode(category)
       color.push(dynamicColors(hash+parseInt(doc['_id'].anno)))

  }
  var datasets=[
    {
      'label':'Ultra Triennale ' + title,
      backgroundColor: color,
      borderColor: 'rgba(200, 200, 200, 0.75)',
      hoverBorderColor: 'rgba(200, 200, 200, 1)',
      'data':utArray
    }
  ]

  var response = {
    data:{
      "labels":categoryArray,
      "datasets":datasets
    },
    options:{
      title:{
        display:true,
        text: 'Ultra Triennale ' + title,
      },
      scales: {
        yAxes: [{
          ticks: {
            // the data minimum used for determining the ticks is Math.min(dataMin, suggestedMin)
            //beginAtZero: true,
            suggestedMin: 0,
            // // the data maximum used for determining the ticks is Math.max(dataMax, suggestedMax)
            // suggestedMax: 1,
            stepSize: 10,
            // fixedStepSize:0.1,
            // min: -10
          }
        }]
      }
    },
    tabularData:{
      'labels':categoryArray,
      'datasets':datasets
    }
  }
  return response
}

module.exports.formatUT = formatUT


function getUTInterannualeAvg(criteria, year){
  years = [year-1,year]
  // console.log(years)
  result = db.collection("siecic").aggregate([
    {
      $match:{
        'anno':{$in:years}
      }
    },
    {
      $group:{
          _id:{
            // First step is to calculate FCR by tribunale.
            // we should keep dimension and area as well, to then group by any of them
            'tribunale':'$tribunale',
            'dimensione':'$dimensione',
            'area':'$area',
            'distretto':'$distretto',
            'regione':'$regione'
            //'aggregazione':criteria,
            //'anno':'$anno'
          },
          pendUtAct:{
            $push:{$cond:[{$eq:['$anno',year]},'$pendenti-ultra-triennali',false]}
          },
          pendTotAct:{
            $push:{$cond:[{$eq:['$anno',year]},'$pendenti',false]}
          },
          pendUtPre:{
            $push:{$cond:[{$eq:['$anno',year]},false,'$pendenti-ultra-triennali']}
          },
          pendTotPre:{
            $push:{$cond:[{$eq:['$anno',year]},false,'$pendenti']}
          }
      }
    },
    {
      $project:{
        _id:1,
        pendUtAct: {$setDifference:['$pendUtAct', [false]]},
        pendTotAct:{$setDifference:['$pendTotAct',[false]]},
        pendUtPre: {$setDifference:['$pendUtPre', [false]]},
        pendTotPre:{$setDifference:['$pendTotPre',[false]]},
      }
    },
    {
      $project:{
        _id:1,
        pendUtAct: {$arrayElemAt:['$pendUtAct', 0]},
        pendTotAct:{$arrayElemAt:['$pendTotAct',0]},
        pendUtPre: {$arrayElemAt:['$pendUtPre', 0]},
        pendTotPre:{$arrayElemAt:['$pendTotPre',0]},
      }
    },
    {
      $project:{
        _id:1,
        pendUtActPerc:{
          $divide:[{$multiply:["$pendUtAct",100]},"$pendTotAct"]
        },
        pendUtPrePerc:{
          $divide:[{$multiply:["$pendUtPre",100]},"$pendTotPre"]
        }
      }
    },
    {
      $project:{
        _id:1,
        'tribunale':'$_id.tribunale',
        'dimensione':'$_id.dimensione',
        'area':'$_id.area',
        'distretto':'$_id.distretto',
        'regione':'$_id.regione',
        utInterannuale:{$divide:[{$subtract:['$pendUtActPerc',
                                             '$pendUtPrePerc']},
                                '$pendUtPrePerc']}
      }
    },
    {
      $group:{
          _id:{
            'aggregazione':criteria,
          },
          utInterannuale:{$avg:'$utInterannuale'}
      }
    },
    {
      $project:{
        _id:1,
        ultraTriennale:round({$multiply:['$utInterannuale',100]},0)
      }
    },
    {
      $sort:{_id:1}
    }
  ])
  // .toArray(function(err,data){
  //   if (err) {
  //     console.log(err)
  //     return
  //   }
  //   console.log(data)
  // })
  return result
}

function getUTInterannualeMedian(criteria, year){
  years = [year-1,year]
  // console.log(years)

  result = db.collection("siecic").aggregate([
    {
      $match:{
        'anno':{$in:years}
      }
    },
    {
      $group:{
          _id:{
            'tribunale':'$tribunale',
            'dimensione':'$dimensione',
            'area':'$area',
            'distretto':'$distretto',
            'regione':'$regione'
          },
          pendUtAct:{
            $push:{$cond:[{$eq:['$anno',year]},'$pendenti-ultra-triennali',false]}
          },
          pendTotAct:{
            $push:{$cond:[{$eq:['$anno',year]},'$pendenti',false]}
          },
          pendUtPre:{
            $push:{$cond:[{$eq:['$anno',year]},false,'$pendenti-ultra-triennali']}
          },
          pendTotPre:{
            $push:{$cond:[{$eq:['$anno',year]},false,'$pendenti']}
          }
      }
    },
    {
      $project:{
        _id:1,
        pendUtAct: {$setDifference:['$pendUtAct', [false]]},
        pendTotAct:{$setDifference:['$pendTotAct',[false]]},
        pendUtPre: {$setDifference:['$pendUtPre', [false]]},
        pendTotPre:{$setDifference:['$pendTotPre',[false]]},
      }
    },
    {
      $project:{
        _id:1,
        pendUtAct: {$arrayElemAt:['$pendUtAct', 0]},
        pendTotAct:{$arrayElemAt:['$pendTotAct',0]},
        pendUtPre: {$arrayElemAt:['$pendUtPre', 0]},
        pendTotPre:{$arrayElemAt:['$pendTotPre',0]},
      }
    },
    {
      $project:{
        _id:1,
        pendUtActPerc:{
          $divide:[{$multiply:["$pendUtAct",100]},"$pendTotAct"]
        },
        pendUtPrePerc:{
          $divide:[{$multiply:["$pendUtPre",100]},"$pendTotPre"]
        }
      }
    },
    {
      $project:{
        _id:1,
        'tribunale':'$_id.tribunale',
        'dimensione':'$_id.dimensione',
        'area':'$_id.area',
        'distretto':'$_id.distretto',
        'regione':'$_id.regione',
        utInterannuale:{$divide:[{$subtract:['$pendUtActPerc',
                                             '$pendUtPrePerc']},
                                '$pendUtPrePerc']}
      }
    },

    {
      $group:{
          _id:{
            'aggregazione':criteria,
          },
          count:{
            $sum:1
          },
          utInterannuale:{$push:'$utInterannuale'}
      }
    },
    {
      $unwind:'$utInterannuale'
    },
    {
      $sort:{
        utInterannuale:1
      }
    },
    {
      $project:{
        '_id':1,
        'count':1,
        'utInterannuale':1,
        'midpoint':{
          $divide:['$count',2]
        }
      }
    },
    {
      $project:{
        '_id':1,
        'count':1,
        'utInterannuale':1,
        'midpoint':1,
        'high':{$ceil:'$midpoint'},
        'low':{$floor:'$midpoint'}
      }
    },
    {
      $group:{
        _id:'$_id',
        utInterannuale:{
          $push:'$utInterannuale'
        },
        high:{$avg:'$high'},
        low:{$avg:'$low'}
      }
    },
    {
      $project:{
        _id:1,
        beginValue:{$arrayElemAt:['$utInterannuale','$high']},
        endValue:  {$arrayElemAt:['$utInterannuale','$low']}
      }
    },
    {
      $project:{
        _id:1,
        utInterannuale:{$avg:['$beginValue','$endValue']}
      }
    },
    {
      $project:{
        _id:1,
        ultraTriennale:round({$multiply:['$utInterannuale',100]},0)
      }
    },
    {
      $sort:{_id:1}
    }
  ])
  // .toArray(function(err,data){
  //   if (err) {
  //     console.log(err)
  //     return
  //   }
  //   console.log(data)
  // })
  return result
}

function getUTInterannualeMode(criteria, year){
  years = [year-1,year]
  // console.log(years)

  result = db.collection("siecic").aggregate([
    {
      $match:{
        'anno':{$in:years}
      }
    },
    {
      $group:{
          _id:{
            // First step is to calculate FCR by tribunale.
            // we should keep dimension and area as well, to then group by any of them
            'tribunale':'$tribunale',
            'dimensione':'$dimensione',
            'area':'$area',
            'distretto':'$distretto',
            'regione':'$regione'
            //'aggregazione':criteria,
            //'anno':'$anno'
          },
          pendUtAct:{
            $push:{$cond:[{$eq:['$anno',year]},'$pendenti-ultra-triennali',false]}
          },
          pendTotAct:{
            $push:{$cond:[{$eq:['$anno',year]},'$pendenti',false]}
          },
          pendUtPre:{
            $push:{$cond:[{$eq:['$anno',year]},false,'$pendenti-ultra-triennali']}
          },
          pendTotPre:{
            $push:{$cond:[{$eq:['$anno',year]},false,'$pendenti']}
          }
      }
    },
    {
      $project:{
        _id:1,
        pendUtAct: {$setDifference:['$pendUtAct', [false]]},
        pendTotAct:{$setDifference:['$pendTotAct',[false]]},
        pendUtPre: {$setDifference:['$pendUtPre', [false]]},
        pendTotPre:{$setDifference:['$pendTotPre',[false]]},
      }
    },
    {
      $project:{
        _id:1,
        pendUtAct: {$arrayElemAt:['$pendUtAct', 0]},
        pendTotAct:{$arrayElemAt:['$pendTotAct',0]},
        pendUtPre: {$arrayElemAt:['$pendUtPre', 0]},
        pendTotPre:{$arrayElemAt:['$pendTotPre',0]},
      }
    },
    {
      $project:{
        _id:1,
        pendUtActPerc:{
          $divide:[{$multiply:["$pendUtAct",100]},"$pendTotAct"]
        },
        pendUtPrePerc:{
          $divide:[{$multiply:["$pendUtPre",100]},"$pendTotPre"]
        }
      }
    },
    {
      $project:{
        _id:1,
        'tribunale':'$_id.tribunale',
        'dimensione':'$_id.dimensione',
        'area':'$_id.area',
        'distretto':'$_id.distretto',
        'regione':'$_id.regione',
        utInterannuale:{
          $divide:[{$subtract:['$pendUtActPerc',
                               '$pendUtPrePerc']},
                  '$pendUtPrePerc']
        }
      }
    },
    {
      $group:{
        _id:{
          'aggregazione':criteria,
          utI:round('$utInterannuale',2)
        },
        count:{
          $sum:1
        }
      }
    },
    {
      $group:{
        _id:{
          aggregazione:'$_id.aggregazione'
        },
        utArray:{$push:{'ut':'$_id.utI','count':'$count'}},
        maxCount:{$max:'$count'}
      }
    },
    {
      $project:{
        _id:1,
        utAux:{
          $filter:{
            input:'$utArray',
            as:'pair',
            cond:{$gte:['$$pair.count','$maxCount']}
          }
        }
      }
    },
    {
      $project:{
        _id:1,
        ultraTriennale:round({$arrayElemAt:['$utAux.ut',0]},2)
      }
    },
    {
      $project:{
        _id:1,
        ultraTriennale:round({$multiply:['$ultraTriennale',100]},0)
      }
    },
    {
      $sort:{_id:1}
    }
  ])
  // .toArray(function(err,data){
  //   if (err) {
  //     console.log(err)
  //     return
  //   }
  //   console.log(data)
  // })
  return result
}

module.exports.getUTInterannualeAvg    =  getUTInterannualeAvg
module.exports.getUTInterannualeMedian =  getUTInterannualeMedian
module.exports.getUTInterannualeMode   =  getUTInterannualeMode

//-------------------------------------------------------------------------

function getUTSuPendentiAvg(criteria, years){

  result = db.collection("siecic").aggregate([
    {
      $match:{
        'anno':{$in:years}
      }
    },
    {
      $group:{
          _id:{
            'aggregazione':criteria,
            'anno':'$anno'
          },
          ultraTriennale:{$avg:{$divide:["$pendenti-ultra-triennali","$pendenti"]}},
      }
    },
    {
      $project:{
        _id:1,
        ultraTriennale:round({$multiply:['$ultraTriennale',100]},0),
      }
    },
    {
      $sort:{_id:1}
    }
  ])
  return result
}



function getUTSuPendentiMedian(criteria, years, res){
  var result = db.collection("siecic").aggregate([
    {
      $match:{
        'anno':{$in:years},
      }
    },
    {
      $group:{
        _id:{
          'aggregazione':criteria,
          'anno':'$anno'
        },
        count:{
          $sum:1
        },
        ultraTriennale:{
          $push:{$divide:["$pendenti-ultra-triennali","$pendenti"]}
        },
      }
    },
    {
      "$unwind":"$ultraTriennale"
    },
    {
      "$sort":{
        ultraTriennale:1
      }
    },
    {
      $project:{
        "_id":1,
        "count":1,
        "ultraTriennale":1,
        "midpoint":{
          $divide:["$count",2]
        }
      }
    },
    {
      $project:{
        "_id":1,
        "count":1,
        "ultraTriennale":1,
        "midpoint":1,
        "high":{
          $ceil:"$midpoint"
        },
        "low":{
          $floor: "$midpoint"
        }
      }
    },
    {
      $group:{
        _id:"$_id",
        ultraTriennale:{
          $push:"$ultraTriennale"
        },
        high: {
          $avg: "$high"
        },
        low: {
          $avg: "$low"
        }
      }
    },
    {
      $project:{
        _id:1,
        "beginValue":{
          "$arrayElemAt":["$ultraTriennale","$high"]
        },
        "endValue":{
          "$arrayElemAt":["$ultraTriennale","$low"]
        },
      }
    },
    {
      $project:{
        _id:1,
        ultraTriennale:{
          $avg:["$beginValue","$endValue"]
        }
      }
    },
    {
      $group:{
        _id:'$_id',
        ultraTriennale:{
          $avg:"$ultraTriennale"
        },
      }
    },
    {
      $project:{
        _id:1,
        ultraTriennale:round({$multiply:['$ultraTriennale',100]},0)
      }
    },
    {
      $sort:{_id:1}
    }
  ])
  // .toArray(function(err,data){
  //   if (err) {
  //     console.log(err)
  //     return
  //   }
  //   console.log(JSON.stringify(data))
  // })
  return result
}

function getUTSuPendentiMode(criteria, years, res){

  result = db.collection("siecic").aggregate([
    {
      $match:{
        'anno':{$in:years}
      }
    },
    {
      $group:{
        _id:{
          'agg':criteria,
          'ann':'$anno',
          ut:round({$avg:{$divide:["$pendenti-ultra-triennali","$pendenti"]}},2),
        },
        count:{
            $sum: 1
        }
      }
    },
    {
      $group:{
        _id:{
          aggregazione:'$_id.agg',
          'anno':'$_id.ann',
        },
        utArray:{$push:{'ultraTriennale':'$_id.ut','count':'$count'}},
        maxCount:{$max:'$count'}
      }
    },
    {
      $project:{
        _id:1,
        utAux:{
          $filter:{
            input: '$utArray',
            as: 'pair',
            cond:{$gte:['$$pair.count','$maxCount']}
          }
        }
      }
    },
    {
      $project:{
        _id:1,
        ultraTriennale:{$arrayElemAt:['$utAux.ultraTriennale',0]}
      }
    },
    {
      $project:{
        _id:1,
        ultraTriennale:round({$multiply:['$ultraTriennale',100]},0)
      }
    },
    {
      $sort:{_id:1}
    }
  ])
  return result
}

module.exports.getUTSuPendentiAvg    = getUTSuPendentiAvg
module.exports.getUTSuPendentiMedian = getUTSuPendentiMedian
module.exports.getUTSuPendentiMode   = getUTSuPendentiMode


function getPendentiUTAvg(criteria, years){
  result = db.collection("siecic").aggregate([
    {
      $match:{
        'anno':{$in:years}
      }
    },
    {
      $group:{
          _id:{
            'aggregazione':criteria,
            'anno':'$anno'
          },
          rawNumbers:{$push:{'pendenti-ultra-triennali':'$pendenti-ultra-triennali','pendenti':'$pendenti'}},
      }
    },
    {
      $project:{
        _id:1,
        "pendentiUltraTriennali": {
            "$divide": [
                { // expression returns total
                    "$reduce": {
                        "input": "$rawNumbers",
                        "initialValue": 0,
                        "in": { "$add": ["$$value", "$$this.pendenti-ultra-triennali"] }
                    }
                },
                { // expression returns ratings count
                    "$cond": [
                        { "$ne": [ { "$size": "$rawNumbers" }, 0 ] },
                        { "$size": "$rawNumbers" },
                        1
                    ]
                }
            ]
        },
        "pendenti": {
            "$divide": [
                { // expression returns total
                    "$reduce": {
                        "input": "$rawNumbers",
                        "initialValue": 0,
                        "in": { "$add": ["$$value", "$$this.pendenti"] }
                    }
                },
                { // expression returns ratings count
                    "$cond": [
                        { "$ne": [ { "$size": "$rawNumbers" }, 0 ] },
                        { "$size": "$rawNumbers" },
                        1
                    ]
                }
            ]
        },
      }
    },
    {
      $project:{
        _id:1,
        // ultraTriennale:"",
        rawNumbers:[
          {'label':'Pendenti UT','data':round('$pendentiUltraTriennali',0)},
          {'label':'Pendenti','data':   round('$pendenti',0)},
        ]
      }
    },
    {
      $sort:{_id:1}
    }
  ])
  // .toArray(function(err,data){
  //   if (err) {
  //     console.log("ERROR")
  //     console.log(err)
  //     return
  //   }
  //   console.log("HOLA")
  //   console.log(data)
  // })
  return result
}

module.exports.getPendentiUTAvg = getPendentiUTAvg


function getPendentiUTMedian(criteria, years, res){
  var result = db.collection("siecic").aggregate([
    {
      $match:{
        'anno':{$in:years},
      }
    },
    {
      $group:{
        _id:{
          'aggregazione':criteria,
          'anno':'$anno'
        },
        count:{
          $sum:1
        },
        pendentiUT:{
          $push:"$pendenti-ultra-triennali"
        },
      }
    },
    {
      "$unwind":"$pendentiUT"
    },
    {
      "$sort":{
        pendentiUT:1
      }
    },
    {
      $project:{
        "_id":1,
        "count":1,
        "pendentiUT":1,
        "midpoint":{
          $divide:["$count",2]
        }
      }
    },
    {
      $project:{
        "_id":1,
        "count":1,
        "pendentiUT":1,
        "midpoint":1,
        "high":{
          $ceil:"$midpoint"
        },
        "low":{
          $floor: "$midpoint"
        }
      }
    },
    {
      $group:{
        _id:"$_id",
        pendentiUT:{
          $push:"$pendentiUT"
        },
        high: {
          $avg: "$high"
        },
        low: {
          $avg: "$low"
        }
      }
    },
    {
      $project:{
        _id:1,
        "beginValue":{
          "$arrayElemAt":["$pendentiUT","$high"]
        },
        "endValue":{
          "$arrayElemAt":["$pendentiUT","$low"]
        },
      }
    },
    {
      $project:{
        _id:1,
        pendentiUT:{
          $avg:["$beginValue","$endValue"]
        }
      }
    },
    {
      $group:{
        _id:'$_id',
        pendentiUT:{
          $avg:"$pendentiUT"
        },
      }
    },
    {
      $project:{
        _id:1,
        rawNumbers:[
          {'label':'Pendenti UT','data':round('$pendentiUT',0)},
        ]
      }
    },
    {
      $sort:{_id:1}
    }
  ])
  // .toArray(function(err,data){
  //   if (err) {
  //     console.log(err)
  //     return
  //   }
  //   console.log(JSON.stringify(data))
  // })
  return result
}

function getObiettiviAvg(criteria, years){
  result = db.collection("siecic").aggregate([
    {
      $match:{
        'anno':{$in:years}
      }
    },
    {
      $group:{
          _id:{
            'aggregazione':criteria,
            'anno':'$anno'
          },
          rawNumbers:{$push:{'obiettivo':'$obiettivo-ultra-triennali'}},
      }
    },
    {
      $project:{
        _id:1,
        "obiettivo": {
            "$divide": [
                { // expression returns total
                    "$reduce": {
                        "input": "$rawNumbers",
                        "initialValue": 0,
                        "in": { "$add": ["$$value", "$$this.obiettivo"] }
                    }
                },
                { // expression returns ratings count
                    "$cond": [
                        { "$ne": [ { "$size": "$rawNumbers" }, 0 ] },
                        { "$size": "$rawNumbers" },
                        1
                    ]
                }
            ]
        },
      }
    },
    {
      $project:{
        _id:1,
        // ultraTriennale:"",
        rawNumbers:[
          // {'label':'Pendenti UT','data':round('$pendentiUltraTriennali',0)},
          {'label':'Obiettivo a Smaltire','data':   round('$obiettivo',0)},
        ]
      }
    },
    {
      $sort:{_id:1}
    }
  ])
  return result
}

function getObiettiviMedian(criteria, years, res){
  var result = db.collection("siecic").aggregate([
    {
      $match:{
        'anno':{$in:years},
      }
    },
    {
      $group:{
        _id:{
          'aggregazione':criteria,
          'anno':'$anno'
        },
        count:{
          $sum:1
        },
        obiettivo:{
          $push:"$obiettivo-ultra-triennali"
        },
      }
    },
    {
      "$unwind":"$obiettivo"
    },
    {
      "$sort":{
        obiettivo:1
      }
    },
    {
      $project:{
        "_id":1,
        "count":1,
        "obiettivo":1,
        "midpoint":{
          $divide:["$count",2]
        }
      }
    },
    {
      $project:{
        "_id":1,
        "count":1,
        "obiettivo":1,
        "midpoint":1,
        "high":{
          $ceil:"$midpoint"
        },
        "low":{
          $floor: "$midpoint"
        }
      }
    },
    {
      $group:{
        _id:"$_id",
        obiettivo:{
          $push:"$obiettivo"
        },
        high: {
          $avg: "$high"
        },
        low: {
          $avg: "$low"
        }
      }
    },
    {
      $project:{
        _id:1,
        "beginValue":{
          "$arrayElemAt":["$obiettivo","$high"]
        },
        "endValue":{
          "$arrayElemAt":["$obiettivo","$low"]
        },
      }
    },
    {
      $project:{
        _id:1,
        obiettivo:{
          $avg:["$beginValue","$endValue"]
        }
      }
    },
    {
      $group:{
        _id:'$_id',
        obiettivo:{
          $avg:"$obiettivo"
        },
      }
    },
    {
      $project:{
        _id:1,
        rawNumbers:[
          {'label':'Obiettivo a Smaltire','data':round('$obiettivo',0)},
        ]
      }
    },
    {
      $sort:{_id:1}
    }
  ])
  // .toArray(function(err,data){
  //   if (err) {
  //     console.log(err)
  //     return
  //   }
  //   console.log(JSON.stringify(data))
  // })
  return result
}


function getPendentiAvg(criteria, years){
  result = db.collection("siecic").aggregate([
    {
      $match:{
        'anno':{$in:years}
      }
    },
    {
      $group:{
          _id:{
            'aggregazione':criteria,
            'anno':'$anno'
          },
          rawNumbers:{$push:{'pendenti':'$pendenti'}},
      }
    },
    {
      $project:{
        _id:1,
        "pendenti": {
            "$divide": [
                { // expression returns total
                    "$reduce": {
                        "input": "$rawNumbers",
                        "initialValue": 0,
                        "in": { "$add": ["$$value", "$$this.pendenti"] }
                    }
                },
                { // expression returns ratings count
                    "$cond": [
                        { "$ne": [ { "$size": "$rawNumbers" }, 0 ] },
                        { "$size": "$rawNumbers" },
                        1
                    ]
                }
            ]
        },
      }
    },
    {
      $project:{
        _id:1,
        // ultraTriennale:"",
        rawNumbers:[
          // {'label':'Pendenti UT','data':round('$pendentiUltraTriennali',0)},
          {'label':'Pendenti','data':   round('$pendenti',0)},
        ]
      }
    },
    {
      $sort:{_id:1}
    }
  ])
  return result
}


function getPendentiMedian(criteria, years, res){
  var result = db.collection("siecic").aggregate([
    {
      $match:{
        'anno':{$in:years},
      }
    },
    {
      $group:{
        _id:{
          'aggregazione':criteria,
          'anno':'$anno'
        },
        count:{
          $sum:1
        },
        pendenti:{
          $push:"$pendenti"
        },
      }
    },
    {
      "$unwind":"$pendenti"
    },
    {
      "$sort":{
        pendenti:1
      }
    },
    {
      $project:{
        "_id":1,
        "count":1,
        "pendenti":1,
        "midpoint":{
          $divide:["$count",2]
        }
      }
    },
    {
      $project:{
        "_id":1,
        "count":1,
        "pendenti":1,
        "midpoint":1,
        "high":{
          $ceil:"$midpoint"
        },
        "low":{
          $floor: "$midpoint"
        }
      }
    },
    {
      $group:{
        _id:"$_id",
        pendenti:{
          $push:"$pendenti"
        },
        high: {
          $avg: "$high"
        },
        low: {
          $avg: "$low"
        }
      }
    },
    {
      $project:{
        _id:1,
        "beginValue":{
          "$arrayElemAt":["$pendenti","$high"]
        },
        "endValue":{
          "$arrayElemAt":["$pendenti","$low"]
        },
      }
    },
    {
      $project:{
        _id:1,
        pendenti:{
          $avg:["$beginValue","$endValue"]
        }
      }
    },
    {
      $group:{
        _id:'$_id',
        pendenti:{
          $avg:"$pendenti"
        },
      }
    },
    {
      $project:{
        _id:1,
        rawNumbers:[
          {'label':'Pendenti','data':round('$pendenti',0)},
        ]
      }
    },
    {
      $sort:{_id:1}
    }
  ])
  // .toArray(function(err,data){
  //   if (err) {
  //     console.log(err)
  //     return
  //   }
  //   console.log(JSON.stringify(data))
  // })
  return result
}

module.exports.getPendentiUTMedian = getPendentiUTMedian
module.exports.getPendentiMedian   = getPendentiMedian

function getUTObiettiviAvg(criteria, years, res){

  result = db.collection("siecic").aggregate([
    {
      $match:{
        'anno':{$in:years}
      }
    },
    {
      $group:{
          _id:{
            'aggregazione':criteria,
            'anno':'$anno'
          },
          // ultraTriennale:{$avg:'$obiettivo-ultra-triennali'}
          ultraTriennale:{$avg:{$divide:[{
            $subtract:['$pendenti-ultra-triennali','$obiettivo-ultra-triennali']},
            '$pendenti']
          }}
      }
    },
    {
      $project:{
        _id:1,
        ultraTriennale:round({$multiply:['$ultraTriennale',100]},0)
      }
    },
    {
      $sort:{_id:1}
    }
  ])
  // .toArray(function(err,data){
  //   if (err) {
  //     console.log(err)
  //     return
  //   }
  //   console.log(data)
  // })
  return result
}


function getUTObiettiviMedian(criteria, years, res){
  var result = db.collection("siecic").aggregate([
    {
      $match:{
        'anno':{$in:years},
      }
    },
    {
      $group:{
        _id:{
          'aggregazione':criteria,
          'anno':'$anno'
        },
        count:{
          $sum:1
        },
        ultraTriennale:{
          //$push:'$obiettivo-ultra-triennali'
          $push:{
            $avg:{$divide:[{
              $subtract:['$pendenti-ultra-triennali','$obiettivo-ultra-triennali']},
              '$pendenti']
            }
          }
        }
      }
    },
    {
      "$unwind":"$ultraTriennale"
    },
    {
      "$sort":{
        ultraTriennale:1
      }
    },
    {
      $project:{
        "_id":1,
        "count":1,
        "ultraTriennale":1,
        "midpoint":{
          $divide:["$count",2]
        }
      }
    },
    {
      $project:{
        "_id":1,
        "count":1,
        "ultraTriennale":1,
        "midpoint":1,
        "high":{
          $ceil:"$midpoint"
        },
        "low":{
          $floor: "$midpoint"
        }
      }
    },
    {
      $group:{
        _id:"$_id",
        ultraTriennale:{
          $push:"$ultraTriennale"
        },
        high: {
          $avg: "$high"
        },
        low: {
          $avg: "$low"
        }
      }
    },
    {
      $project:{
        _id:1,
        //simpleClearance:1,
        "beginValue":{
          "$arrayElemAt":["$ultraTriennale","$high"]
        },
        "endValue":{
          "$arrayElemAt":["$ultraTriennale","$low"]
        },
      }
    },
    {
      $project:{
        _id:1,
        ultraTriennale:{
          $avg:["$beginValue","$endValue"]
        }
      }
    },
    {
      $project:{
        _id:1,
        ultraTriennale:round({$multiply:['$ultraTriennale',100]},0)
      }
    },
    {
      $sort:{_id:1}
    }
  ])
  return result
}

function getUTObiettiviMode(criteria, years, res){

  result = db.collection("siecic").aggregate([
    {
      $match:{
        'anno':{$in:years}
      }
    },
    {
      $group:{
        _id:{
          'agg':criteria,
          'ann':'$anno',
          ut:{$avg:{$divide:[{
              $subtract:['$pendenti-ultra-triennali','$obiettivo-ultra-triennali']},
              '$pendenti']
            }
          }
          //ut:'$obiettivo-ultra-triennali',
        },
        count:{
            $sum: 1
        }
      }
    },
    {
      $group:{
        _id:{
          aggregazione:'$_id.agg',
          'anno':'$_id.ann',
        },
        utArray:{$push:{'ultraTriennale':'$_id.ut','count':'$count'}},
        maxCount:{$max:'$count'}
      }
    },
    {
      $project:{
        _id:1,
        utAux:{
          $filter:{
            input: '$utArray',
            as: 'pair',
            cond:{$gte:['$$pair.count','$maxCount']}
          }
        }
      }
    },
    {
      $project:{
        _id:1,
        ultraTriennale:{$arrayElemAt:['$utAux.ultraTriennale',0]}
      }
    },
    {
      $project:{
        _id:1,
        ultraTriennale:round({$multiply:['$ultraTriennale',100]},0)
      }
    },
    {
      $sort:{_id:1}
    }
  ])
  return result
}

module.exports.getUTObiettiviAvg    = getUTObiettiviAvg
module.exports.getUTObiettiviMedian = getUTObiettiviMedian
module.exports.getUTObiettiviMode   = getUTObiettiviMode

function getUTAvg(criteria, years, res){

  result = db.collection("siecic").aggregate([
    {
      $match:{
        'anno':{$in:years}
      }
    },
    {
      $group:{
          _id:{
            'aggregazione':criteria,
            'anno':'$anno'
          },
          ultraTriennale:{$avg:'$pendenti-ultra-triennali'}
      }
    },
    {
      $project:{
        _id:1,
        ultraTriennale:round({$multiply:['$ultraTriennale',100]},0)
      }
    },
    {
      $sort:{_id:1}
    }
  ])
  // .toArray(function(err,data){
  //   if (err) {
  //     console.log(err)
  //     return
  //   }
  //   console.log(data)
  // })
  return result
}

function getUTMedian(criteria, years, res){
  var result = db.collection("siecic").aggregate([
    {
      $match:{
        'anno':{$in:years},
      }
    },
    {
      $group:{
        _id:{
          'aggregazione':criteria,
          'anno':'$anno'
        },
        count:{
          $sum:1
        },
        ultraTriennale:{
          $push:'$pendenti-ultra-triennali'
        }
      }
    },
    {
      "$unwind":"$ultraTriennale"
    },
    {
      "$sort":{
        ultraTriennale:1
      }
    },
    {
      $project:{
        "_id":1,
        "count":1,
        "ultraTriennale":1,
        "midpoint":{
          $divide:["$count",2]
        }
      }
    },
    {
      $project:{
        "_id":1,
        "count":1,
        "ultraTriennale":1,
        "midpoint":1,
        "high":{
          $ceil:"$midpoint"
        },
        "low":{
          $floor: "$midpoint"
        }
      }
    },
    {
      $group:{
        _id:"$_id",
        ultraTriennale:{
          $push:"$ultraTriennale"
        },
        high: {
          $avg: "$high"
        },
        low: {
          $avg: "$low"
        }
      }
    },
    {
      $project:{
        _id:1,
        //simpleClearance:1,
        "beginValue":{
          "$arrayElemAt":["$ultraTriennale","$high"]
        },
        "endValue":{
          "$arrayElemAt":["$ultraTriennale","$low"]
        },
      }
    },
    {
      $project:{
        _id:1,
        ultraTriennale:{
          $avg:["$beginValue","$endValue"]
        }
      }
    },
    {
      $project:{
        _id:1,
        ultraTriennale:round({$multiply:['$ultraTriennale',100]},0)
      }
    },
    {
      $sort:{_id:1}
    }
  ])
  return result
}


function getUTMode(criteria, years, res){

  result = db.collection("siecic").aggregate([
    {
      $match:{
        'anno':{$in:years}
      }
    },
    {
      $group:{
        _id:{
          'agg':criteria,
          'ann':'$anno',
          ut:'$pendenti-ultra-triennali',
        },
        count:{
            $sum: 1
        }
      }
    },
    {
      $group:{
        _id:{
          aggregazione:'$_id.agg',
          'anno':'$_id.ann',
        },
        utArray:{$push:{'ultraTriennale':'$_id.ut','count':'$count'}},
        maxCount:{$max:'$count'}
      }
    },
    {
      $project:{
        _id:1,
        utAux:{
          $filter:{
            input: '$utArray',
            as: 'pair',
            cond:{$gte:['$$pair.count','$maxCount']}
          }
        }
      }
    },
    {
      $project:{
        _id:1,
        ultraTriennale:{$arrayElemAt:['$utAux.ultraTriennale',0]}
      }
    },
    {
      $project:{
        _id:1,
        ultraTriennale:round({$multiply:['$ultraTriennale',100]},0)
      }
    },
    {
      $sort:{_id:1}
    }
  ])
  return result
}

module.exports.getUTAvg    = getUTAvg
module.exports.getUTMedian = getUTMedian
module.exports.getUTMode   = getUTMode


function getUTInterannualeByTribunale(metric,tribunale,criteria,year,callback){

  switch(metric) {
      case 'Average':
          funct = getUTInterannualeAvg
          break;
      case 'Median':
          funct = getUTInterannualeMedian
          break;
      case 'Mode':
          funct = getUTInterannualeMode
          break;
      default:
          funct = getUTInterannualeAvg
  }

  var partialRes = []
  funct('$tribunale',year).toArray(function (err, data){
    if (err) {
      console.log(err)
      callback(err,null)
    }
    for (index in data){
      var doc = data[index]
      if (doc['_id'].aggregazione == tribunale){
        doc['_id'].anno = year
        partialRes.push(doc)
      }
    }
    //    var result = cr.formatClearance(data,"Average")

    var filter
    tr.getTribunaleDetail(tribunale).toArray(function(err,data){
      if (err) {
        console.log(err)
        callback(err,null)
      }
      for (index in data){
        filter = data[index]
      }
      funct('$'+criteria,year)
      .toArray(function (err, data){
        if (err) {
          console.log(err)
          callback(err,null)
        }
        for (index in data){
          if (data[index]['_id'].aggregazione == filter[criteria]){
            data[index]['_id'].anno = year
            partialRes.push(data[index])
          }
        }
        callback(null,partialRes)
      })
    })
  })
}

function getUTInterannuale(metric,criteria,year,callback){
  var partialRes = []
  switch(metric) {
      case 'Average':
          funct = getUTInterannualeAvg
          break;
      case 'Median':
          funct = getUTInterannualeMedian
          break;
      case 'Mode':
          funct = getUTInterannualeMode
          break;
      default:
          funct = getUTInterannualeAvg
  }
      funct('$'+criteria,year)
      .toArray(function (err, data){
        if (err) {
          console.log(err)
          callback(err,null)
        }
        for (index in data){
          // if (data[index]['_id'].aggregazione == filter[criteria]){
            data[index]['_id'].anno = year
            partialRes.push(data[index])
          // }
        }
        callback(null,partialRes)
      })
  //   })
  // })
}

module.exports.getUTInterannuale            = getUTInterannuale
module.exports.getUTInterannualeByTribunale = getUTInterannualeByTribunale



function getPendentiUTByTribunale(metric,tribunale,criteria,years,callback){
  var partial = []
  var title = ""
  switch(metric) {
      case 'Average':
          funct     = getPendentiUTAvg
          title     = 'Media'
          break;
      case 'Median':
          funct     = getPendentiUTMedian
          title     = 'Mediana'
          break;
      case 'Mode':
          funct     = getPendentiUTAvg
          title = 'Moda'
          break;
      default:
          funct     = getPendentiUTAvg
          title     = 'Media'
  }
  // funct('$'+criteria,years).toArray(function (err, data){
  funct('$tribunale',years).toArray(function (err, data){
    if (err) {
      console.log(err)
      return
    }
    for (index in data){
      var doc = data[index]
      if (doc['_id'].aggregazione == tribunale){
        partial.push(doc)
      }
    }
  //    var result = cr.formatClearance(data,"Average")
    var filter
    tr.getTribunaleDetail(tribunale).toArray(function(err,data){
      if (err) {
        console.log(err)
        return
      }
      for (index in data){
        filter = data[index]
      }
      funct('$'+criteria,years).toArray(function (err, data){
        if (err) {
          console.log(err)
          return
        }
        for (index in data){
          if (data[index]['_id'].aggregazione == filter[criteria]) partial.push(data[index])
        }
        // console.log(JSON.stringify(partial))
        // TODO Continuar Acá: cómo mostrar la data de RawResults en la tabla?
        res = utils.formatTable(partial,"Pendenti Ultra Triennali " + title)
        callback(res)
      })
      //getClearanceRates(res)
    })
  })
}

function getObiettiviByTribunale(metric,tribunale,criteria,years,callback){
  partial = []
  title = ""
  switch(metric) {
      case 'Average':
          funct     = getObiettiviAvg
          title     = 'Media'
          break;
      case 'Median':
          funct     = getObiettiviMedian
          title     = 'Mediana'
          break;
      case 'Mode':
          funct     = getObiettiviAvg
          title     = 'Moda'
          break;
      default:
          funct     = getObiettiviAvg
          title     = 'Media'
  }
  // funct('$'+criteria,years).toArray(function (err, data){
  funct('$tribunale',years).toArray(function (err, data){
    if (err) {
      console.log(err)
      return
    }
    for (index in data){
      var doc = data[index]
      if (doc['_id'].aggregazione == tribunale){
        partial.push(doc)
      }
    }
  //    var result = cr.formatClearance(data,"Average")
    var filter
    tr.getTribunaleDetail(tribunale).toArray(function(err,data){
      if (err) {
        console.log(err)
        return
      }
      for (index in data){
        filter = data[index]
      }
      funct('$'+criteria,years).toArray(function (err, data){
        if (err) {
          console.log(err)
          return
        }
        for (index in data){
          if (data[index]['_id'].aggregazione == filter[criteria]) partial.push(data[index])
        }
        // console.log(JSON.stringify(partial))
        // TODO Continuar Acá: cómo mostrar la data de RawResults en la tabla?
        res = utils.formatTable(partial,"Obiettivo a Smaltire " + title)
        callback(res)
      })
      //getClearanceRates(res)
    })
  })
}

function getObiettivi(metric,criteria,years,callback){
  var partial = []
  var title = ""
  switch(metric) {
      case 'Average':
          funct   = getObiettiviAvg
          title   = 'Media'
          break;
      case 'Median':
          funct   = getObiettiviMedian
          title   = 'Mediana'
          break;
      case 'Mode':
          funct   = getObiettiviAvg
          title   = 'Moda'
          break;
      default:
          funct   = getObiettiviAvg
          title   = 'Media'
  }
  funct('$'+criteria,years).toArray(function (err, data){
    if (err) {
      console.log(err)
      return
    }
    for (index in data){
      partial.push(data[index])
    }
    res = utils.formatTable(partial,"Obiettivo a Smaltire " + title)
    callback(res)
  })
}


module.exports.getObiettiviByTribunale = getObiettiviByTribunale
module.exports.getObiettivi            = getObiettivi


function getPendentiByTribunale(metric,tribunale,criteria,years,callback){
  partial = []
  title = ""
  switch(metric) {
      case 'Average':
          funct     = getPendentiAvg
          title     = 'Media'
          break;
      case 'Median':
          funct     = getPendentiMedian
          title     = 'Mediana'
          break;
      case 'Mode':
          funct     = getPendentiAvg
          title = 'Moda'
          break;
      default:
          funct     = getPendentiAvg
          title     = 'Media'
  }
  // funct('$'+criteria,years).toArray(function (err, data){
  funct('$tribunale',years).toArray(function (err, data){
    if (err) {
      console.log(err)
      return
    }
    for (index in data){
      var doc = data[index]
      if (doc['_id'].aggregazione == tribunale){
        partial.push(doc)
      }
    }
  //    var result = cr.formatClearance(data,"Average")
    var filter
    tr.getTribunaleDetail(tribunale).toArray(function(err,data){
      if (err) {
        console.log(err)
        return
      }
      for (index in data){
        filter = data[index]
      }
      funct('$'+criteria,years).toArray(function (err, data){
        if (err) {
          console.log(err)
          return
        }
        for (index in data){
          if (data[index]['_id'].aggregazione == filter[criteria]) partial.push(data[index])
        }
        // console.log(JSON.stringify(partial))
        // TODO Continuar Acá: cómo mostrar la data de RawResults en la tabla?
        res = utils.formatTable(partial,"Pendenti " + title)
        callback(res)
      })
      //getClearanceRates(res)
    })
  })
}

function getPendentiUT(metric,criteria,years,callback){
  var partial = []
  var title = ""
  switch(metric) {
      case 'Average':
          funct   = getPendentiUTAvg
          title   = 'Media'
          break;
      case 'Median':
          funct   = getPendentiUTMedian
          title   = 'Mediana'
          break;
      case 'Mode':
          funct   = getPendentiUTAvg
          title   = 'Moda'
          break;
      default:
          funct   = getPendentiUTAvg
          title   = 'Media'
  }
  funct('$'+criteria,years).toArray(function (err, data){
    if (err) {
      console.log(err)
      return
    }
    for (index in data){
      partial.push(data[index])
    }
    res = utils.formatTable(partial,"Pendenti Ultra Triennali " + title)
    callback(res)
  })
}

function getPendenti(metric,criteria,years,callback){
  var partial = []
  var title = ""
  switch(metric) {
      case 'Average':
          funct   = getPendentiAvg
          title   = 'Media'
          break;
      case 'Median':
          funct   = getPendentiMedian
          title   = 'Mediana'
          break;
      case 'Mode':
          funct   = getPendentiAvg
          title   = 'Moda'
          break;
      default:
          funct   = getPendentiAvg
          title   = 'Media'
  }
  funct('$'+criteria,years).toArray(function (err, data){
    if (err) {
      console.log(err)
      return
    }
    for (index in data){
      partial.push(data[index])
    }
    res = utils.formatTable(partial,"Pendenti Ultra Triennali " + title)
    callback(res)
  })
}

module.exports.getPendentiUTByTribunale = getPendentiUTByTribunale
module.exports.getPendentiByTribunale   = getPendentiByTribunale
module.exports.getPendentiUT            = getPendentiUT
module.exports.getPendenti              = getPendenti
