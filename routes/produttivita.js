var express = require('express');
var router = express.Router();

var tr = require('../controller/tribunali')
var p  = require('../controller/produttivita')
var utils = require('../utils/utils.js')


router.get("/ProduttivitaMagistratoByTribunaleAverage", (req,res)=>{

  var tribunale = req.query.tribunale
  var criteria  = req.query.criteria

  var years = req.query.years.map(function(year){
    return parseInt(year)
  })
  getProduttivitaMagistratoByTribunale('Average', tribunale,criteria,years,function(result){
      res.json(result)
  })
})

router.get("/ProduttivitaMagistratoByTribunaleMedian", (req,res)=>{

  var tribunale = req.query.tribunale
  var criteria  = req.query.criteria

  var years = req.query.years.map(function(year){
    return parseInt(year)
  })
  getProduttivitaMagistratoByTribunale('Median', tribunale,criteria,years,function(result){
      res.json(result)
  })
})

router.get("/ProduttivitaMagistratoByTribunaleMode", (req,res)=>{

  var tribunale = req.query.tribunale
  var criteria  = req.query.criteria

  var years = req.query.years.map(function(year){
    return parseInt(year)
  })
  getProduttivitaMagistratoByTribunale('Mode', tribunale,criteria,years,function(result){
      res.json(result)
  })
})

function getProduttivitaMagistratoByTribunale(metric, tribunale,criteria,years,callback){
  partial = []

  switch(metric) {
      case 'Average':
          funct = p.getProduttivitaMagistratoAvg
          break;
      case 'Median':
          funct = p.getProduttivitaMagistratoMedian
          break;
      case 'Mode':
          funct = p.getProduttivitaMagistratoMode
          break;
      default:
          funct = p.getProduttivitaMagistratoAvg
  }

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
        res = p.formatP(partial," per Magistrato (per ogni ufficio) " + metric)
        callback(res)
      })
      //getClearanceRates(res)
    })
  })
}

router.get("/ProduttivitaControfattualeByTribunaleAverage", (req,res)=>{

  var tribunale = req.query.tribunale
  var criteria  = req.query.criteria

  var years = req.query.years.map(function(year){
    return parseInt(year)
  })
  getProduttivitaControfattualeByTribunale('Average', tribunale,criteria,years,function(result){
      res.json(result)
  })
})

router.get("/ProduttivitaControfattualeByTribunaleMedian", (req,res)=>{

  var tribunale = req.query.tribunale
  var criteria  = req.query.criteria

  var years = req.query.years.map(function(year){
    return parseInt(year)
  })
  getProduttivitaControfattualeByTribunale('Median', tribunale,criteria,years,function(result){
      res.json(result)
  })
})

router.get("/ProduttivitaControfattualeByTribunaleMode", (req,res)=>{

  var tribunale = req.query.tribunale
  var criteria  = req.query.criteria

  var years = req.query.years.map(function(year){
    return parseInt(year)
  })
  getProduttivitaControfattualeByTribunale('Mode', tribunale,criteria,years,function(result){
      res.json(result)
  })
})

function getProduttivitaControfattualeByTribunale(metric, tribunale,criteria,years,callback){
  partial = []

  switch(metric) {
      case 'Average':
          funct = p.getProduttivitaControfattualeAvg
          break;
      case 'Median':
          funct = p.getProduttivitaControfattualeMedian
          break;
      case 'Mode':
          funct = p.getProduttivitaControfattualeMode
          break;
      default:
          funct = p.getProduttivitaControfattualeAvg
  }

  // funct('$'+criteria,years).toArray(function (err, data){
  //   if (err) {
  //     console.log(err)
  //     return
  //   }
  //   console.log(data)
  // })

  funct('$' + criteria,years).toArray(function (err, data){
    if (err) {
      console.log(err)
      return
    }
    for (index in data){
      var doc = data[index]
      if (doc['tribunale'] == tribunale){
        partial.push(doc)
      }
    }
    res = p.formatP(partial," Controfattuale (%) " + tribunale + ' ' + metric)
    callback(res)
  //    var result = cr.formatClearance(data,"Average")
    // var filter
    // tr.getTribunaleDetail(tribunale).toArray(function(err,data){
    //   if (err) {
    //     console.log(err)
    //     return
    //   }
    //   for (index in data){
    //     filter = data[index]
    //   }
    //   funct('$'+criteria,years).toArray(function (err, data){
    //     if (err) {
    //       console.log(err)
    //       return
    //     }
    //     for (index in data){
    //       if (data[index]['_id'].aggregazione == filter[criteria]) partial.push(data[index])
    //     }
    //     res = p.formatP(partial," per Magistrato (per ogni ufficio) " + metric)
    //     callback(res)
    //   })
    //   //getClearanceRates(res)
    // })
  })
}

module.exports = router
