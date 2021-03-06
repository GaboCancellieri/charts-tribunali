var express = require('express');
var router = express.Router();

var ut = require('../controller/ultraTriennale')
var tr = require('../controller/tribunali')
var utils = require('../utils/utils.js')

router.get("/UTSuPendentiByTribunaleAverage", (req,res)=>{

  var tribunale = req.query.tribunale
  var criteria  = req.query.criteria

  var years = req.query.years.map(function(year){
    return parseInt(year)
  })
  var results = []
  getUTSuPendentiByTribunale('Average', tribunale,criteria,years,function(result1){
    results.push(result1)
    ut.getPendentiUTByTribunale('Average', tribunale,criteria,years,function(result2){
      results.push(result2)
      utils.joinResults(results,function(result){
        // console.log("FINAL")
        // console.log(JSON.stringify(result))
        res.json(result)
      })
    })
  })
})

router.get("/UTSuPendentiByTribunaleMedian", (req,res)=>{

  var tribunale = req.query.tribunale
  var criteria  = req.query.criteria

  var years = req.query.years.map(function(year){
    return parseInt(year)
  })
  var results = []
  getUTSuPendentiByTribunale('Median', tribunale,criteria,years,function(result1){
    results.push(result1)
    ut.getPendentiUTByTribunale('Median',tribunale,criteria,years,function(result2){
      results.push(result2)
      ut.getPendentiByTribunale('Median',tribunale,criteria,years,function(result3){
        results.push(result3)
        utils.joinResults(results,function(result){
          res.json(result)
        })
      })
    })
  })
})

router.get("/UTSuPendentiByTribunaleMode", (req,res)=>{

  var tribunale = req.query.tribunale
  var criteria  = req.query.criteria

  var years = req.query.years.map(function(year){
    return parseInt(year)
  })
  getUTSuPendentiByTribunale('Mode', tribunale,criteria,years,function(result){
      res.json(result)
  })
})


router.get("/UTObiettiviByTribunaleAverage", (req,res)=>{

  var tribunale = req.query.tribunale
  var criteria  = req.query.criteria

  var years = req.query.years.map(function(year){
    return parseInt(year)
  })
  var results = []
  var result1 = null
  var result2 = null
  var result3 = null

  getUTSuPendentiByTribunale('Average', tribunale,criteria,years,function(result1){
      results.push(result1)
      getUTObiettiviByTribunale('Average',tribunale, criteria,years,function(result2){
      results.push(result2)
      ut.getPendentiUTByTribunale('Average', tribunale,criteria,years,function(result3){
        results.push(result3)
        ut.getObiettiviByTribunale('Average',tribunale,criteria,years,(result4)=>{
          results.push(result4)
          utils.joinResults(results,function(result){
            res.json(result)
          })
        })
      })
    })
  })
})

router.get("/UTObiettiviByTribunaleMedian", (req,res)=>{

  var tribunale = req.query.tribunale
  var criteria  = req.query.criteria

  var years = req.query.years.map(function(year){
    return parseInt(year)
  })
  results = []
  var result1,result2,result3,result4,result5 = null
  getUTSuPendentiByTribunale('Median', tribunale,criteria,years,function(result1){
      results.push(result1)
    getUTObiettiviByTribunale('Median',tribunale, criteria,years,function(result2){
      results.push(result2)
      ut.getPendentiUTByTribunale('Median',tribunale,criteria,years,function(result3){
        results.push(result3)
        ut.getPendentiByTribunale('Median',tribunale,criteria,years,function(result4){
          results.push(result4)
          ut.getObiettiviByTribunale('Median',tribunale,criteria,years,(result5)=>{
            results.push(result5)
            utils.joinResults(results, function(result){
              res.json(result)
            })
          })
        })
      })
    })
  })
})

router.get("/UTObiettiviByTribunaleMode", (req,res)=>{

  var tribunale = req.query.tribunale
  var criteria  = req.query.criteria

  var years = req.query.years.map(function(year){
    return parseInt(year)
  })
  results = []
  getUTSuPendentiByTribunale('Mode', tribunale,criteria,years,function(result1){
    results.push(result1)
    getUTObiettiviByTribunale('Mode',tribunale, criteria,years,function(result2){
      results.push(result2)
      utils.joinResults(results, function(result){
        res.json(result)
      })
    })
  })
})

router.get("/UTInterannualeByTribunaleAverage", (req,res)=>{
  var tribunale = req.query.tribunale
  var criteria  = req.query.criteria
  var years     = req.query.years.map(function(year){
    return parseInt(year)
  })
  var partial = []
  var results = []
  var result1 = null
  var result2 = null
  let requests = years.map((year) => {
    return new Promise((resolve,reject) => {
      // console.log(year)
      ut.getUTInterannualeByTribunale('Average',tribunale,criteria,year,function(err, result1){
        if (err){
          console.log(err)
          reject(err)
        }
        partial = partial.concat(result1)
        // console.log(JSON.stringify(partial))
        resolve(true)
      })
    })
  })
  Promise.all(requests).then(() => {
      // console.log("PARTIAL: "+ JSON.stringify(partial))
      ut.getPendentiUTByTribunale('Average', tribunale,criteria,years,function(result2){
        results.push(result2)
        var formatRes = ut.formatUT(partial, "Interannuale Media (%)")
        results.splice(0,0,formatRes)
        utils.joinResults(results,function(result){
          res.json(result)
        })
      })
  },(error)=>{
    console.log(error)
  });
})

router.get("/UTInterannualeByTribunaleMedian", (req,res)=>{
  var tribunale = req.query.tribunale
  var criteria  = req.query.criteria
  var years     = req.query.years.map(function(year){
    return parseInt(year)
  })
  var partial = []
  var results = []
  var result1 = null
  var result2 = null
  var result3 = null
  let requests = years.map((year) => {
    return new Promise((resolve,reject) => {
      // console.log(year)
      ut.getUTInterannualeByTribunale('Median',tribunale,criteria,year,function(err, result1){
          if (err){
            console.log(err)
            reject(err)
          }
          partial = partial.concat(result1)
          resolve(true)

          // console.log(JSON.stringify(partial))
      })
    })
  })
  Promise.all(requests).then(() => {
    // console.log('done')
    ut.getPendentiUTByTribunale('Median', tribunale,criteria,years,function(result2){
      results.push(result2)
      ut.getPendentiByTribunale('Median',tribunale,criteria,years,function(result3){
        results.push(result3)
        var formatRes = ut.formatUT(partial, "Interannuale Mediana (%)")
        results.splice(0,0,formatRes)
        utils.joinResults(results,function(result){
          res.json(result)
        })
      })
    })
  },(error)=>{
    console.log(error)
  });
})

router.get("/UTInterannualeByTribunaleMode", (req,res)=>{
  var tribunale = req.query.tribunale
  var criteria  = req.query.criteria
  var years     = req.query.years.map(function(year){
    return parseInt(year)
  })
  partial = []
  let requests = years.map((year) => {
    return new Promise((resolve,reject) => {
      // console.log(year)
      ut.getUTInterannualeByTribunale('Mode',tribunale,criteria,year,function(err, result){
          if (err){
            console.log(err)
            reject(err)
          }
          partial = partial.concat(result)
          // console.log(JSON.stringify(partial))
          resolve(true)
      })
    })
  })
  Promise.all(requests).then(() => {
    // console.log('done')
    var result = ut.formatUT(partial,"Interannuale Mode")
    res.json(result)
  },(error)=>{
    console.log(error)
  });
})

router.get("/UTSuPendentiAverage", (req,res)=>{

  // var tribunale = req.query.tribunale
  var criteria  = req.query.criteria
  var years = req.query.years.map(function(year){
    return parseInt(year)
  })
  var result1, result2 = null
  var results          = []
  getUTSuPendenti('Average',criteria,years,function(result1){
    results.push(result1)
    ut.getPendentiUT('Average',criteria,years,function(result2){
      results.push(result2)
      utils.joinResults(results,function(result){
        res.json(result)
      })
    })
  })
})

router.get("/UTSuPendentiMedian", (req,res)=>{

  var criteria  = req.query.criteria
  var years = req.query.years.map(function(year){
    return parseInt(year)
  })
  var results = []
  var result1, result2, result3 = null
  getUTSuPendenti('Median',criteria,years,function(result1){
    results.push(result1)
    ut.getPendentiUT('Median',criteria,years,function(result2){
      results.push(result2)
      ut.getPendenti('Median',criteria,years,function(result3){
        results.push(result3)
        utils.joinResults(results,function(result){
          res.json(result)
        })
      })
    })
  })
})

router.get("/UTSuPendentiMode", (req,res)=>{

  // var tribunale = req.query.tribunale
  var criteria  = req.query.criteria
  var years = req.query.years.map(function(year){
    return parseInt(year)
  })
  getUTSuPendenti('Mode',criteria,years,function(result){
      res.json(result)
  })
})

router.get("/UTObiettiviAverage", (req,res)=>{

  // var tribunale = req.query.tribunale
  var criteria  = req.query.criteria

  var years = req.query.years.map(function(year){
    return parseInt(year)
  })
  var results = []
  var result1, result2, result3, result4 = null
  getUTSuPendenti('Average',criteria,years,function(result1){
    results.push(result1)
    getUTObiettivi('Average',criteria,years,function(result2){
      results.push(result2)
      ut.getPendentiUT('Average',criteria,years,function(result3){
        results.push(result3)
        ut.getObiettivi('Average',criteria,years,(result4)=>{
          results.push(result4)
          utils.joinResults(results,function(result){
            res.json(result)
          })
        })
      })
    })
  })
})

router.get("/UTObiettiviMedian", (req,res)=>{

  // var tribunale = req.query.tribunale
  var criteria  = req.query.criteria

  var years = req.query.years.map(function(year){
    return parseInt(year)
  })
  var results = []
  var result1, result2, result3, result4,result5 = null
  getUTSuPendenti('Median',criteria,years,function(result1){
      results.push(result1)
    getUTObiettivi('Median',criteria,years,function(result2){
      results.push(result2)
      ut.getPendentiUT('Median',criteria,years,function(result3){
        results.push(result3)
        ut.getPendenti('Median',criteria,years,function(result4){
          results.push(result4)
          ut.getObiettivi('Median',criteria,years,(result5)=>{
            results.push(result5)
            utils.joinResults(results,function(result){
              res.json(result)
            })
          })
        })
      })
    })
  })
})

router.get("/UTObiettiviMode", (req,res)=>{

  // var tribunale = req.query.tribunale
  var criteria  = req.query.criteria

  var years = req.query.years.map(function(year){
    return parseInt(year)
  })
  var results = []
  getUTSuPendenti('Mode',criteria,years,function(result1){
      results.push(result1)
    getUTObiettivi('Mode',criteria,years,function(result2){
      results.push(result2)
      utils.joinResults(results,function(result){
        res.json(result)
      })
    })
  })
})

router.get("/UTInterannualeAverage", (req,res)=>{
  // var tribunale = req.query.tribunale
  var criteria  = req.query.criteria
  var years     = req.query.years.map(function(year){
    return parseInt(year)
  })
  var partial = []
  var results = []
  var result1, result2, result3 = null
  let requests = years.map((year) => {
    return new Promise((resolve,reject) => {
      // console.log(year)
      ut.getUTInterannuale('Average',criteria,year,function(err, result1){
          if (err){
            console.log(err)
            reject(err)
          }
          partial = partial.concat(result1)
          // console.log(JSON.stringify(partial))
          resolve(true)
      })
    })
  })
  Promise.all(requests).then(() => {

    ut.getPendentiUT('Average',criteria,years,function(result2){
      results.push(result2)
      var formatRes = ut.formatUT(partial,"Interannuale Media (%)")
      results.splice(0,0,formatRes)
      utils.joinResults(results,function(result){
        res.json(result)
      })
    })
    // console.log('done')
  },(error)=>{
    console.log(error)
  })
})

router.get("/UTInterannualeMedian", (req,res)=>{
  // var tribunale = req.query.tribunale
  var criteria  = req.query.criteria
  var years     = req.query.years.map(function(year){
    return parseInt(year)
  })
  var partial = []
  var results = []
  var result1, result2, result3 = null
  let requests = years.map((year) => {
    return new Promise((resolve,reject) => {
      // console.log(year)
      ut.getUTInterannuale('Median',criteria,year,function(err, result1){
          if (err){
            console.log(err)
            reject(err)
          }
          partial = partial.concat(result1)
          // console.log(JSON.stringify(partial))
          resolve(true)
      })
    })
  })
  Promise.all(requests).then(() => {

    ut.getPendentiUT('Median',criteria,years,function(result2){
      results.push(result2)
      ut.getPendenti('Median',criteria,years,function(result3){
        results.push(result3)
        var formatRes = ut.formatUT(partial,'Interannuale Mediana (%)')
        results.splice(0,0,formatRes)
        utils.joinResults(results,function(result){
          res.json(result)
        })
      })
    })
  },(error)=>{
    console.log(error)
  })
})

router.get("/UTInterannualeMode", (req,res)=>{
  // var tribunale = req.query.tribunale
  var criteria  = req.query.criteria
  var years     = req.query.years.map(function(year){
    return parseInt(year)
  })
  partial = []
  let requests = years.map((year) => {
    return new Promise((resolve,reject) => {
      // console.log(year)
      ut.getUTInterannuale('Mode',criteria,year,function(err, result){
          if (err){
            console.log(err)
            reject(err)
          }
          partial = partial.concat(result)
          // console.log(JSON.stringify(partial))
          resolve(true)
      })
    })
  })
  Promise.all(requests).then(() => {
    // console.log('done')
    var result = ut.formatUT(partial,"Interannuale Moda")
    res.json(result)
  },(error)=>{
    console.log(error)
  })
})

function getUTSuPendenti(metric,criteria,years,callback){
  var partial = []
  var title = ""
  switch(metric) {
      case 'Average':
          funct = ut.getUTSuPendentiAvg
          title = "Media"
          break;
      case 'Median':
          funct = ut.getUTSuPendentiMedian
          title = "Mediana"
          break;
      case 'Mode':
          funct = ut.getUTSuPendentiMode
          title = "Moda"
          break;
      default:
          funct = ut.getUTSuPendentiAvg
          title = "Media"
  }
  funct('$'+criteria,years).toArray(function (err, data){
    if (err) {
      console.log(err)
      return
    }
    for (index in data){
      partial.push(data[index])
    }
    res = ut.formatUT(partial,"Su Pendenti (%) " + title)
    callback(res)
  })
}


function getUTSuPendentiByTribunale(metric,tribunale,criteria,years,callback){
  partial = []
  title = ""
  switch(metric) {
      case 'Average':
          funct     = ut.getUTSuPendentiAvg
          title     = 'Media'
          break;
      case 'Median':
          funct     = ut.getUTSuPendentiMedian
          title     = 'Mediana'
          break;
      case 'Mode':
          funct     = ut.getUTSuPendentiMode
          title = 'Moda'
          break;
      default:
          funct     = ut.getUTSuPendentiAvg
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
        res = ut.formatUT(partial,"Su Pendenti (%) " + title)
        callback(res)
      })
      //getClearanceRates(res)
    })
  })
}


function getUTObiettivi(metric,criteria,years,callback){
  var title   = ""
  var partial = []
  switch(metric) {
      case 'Average':
          funct = ut.getUTObiettiviAvg
          title = "Media"
          break;
      case 'Median':
          funct = ut.getUTObiettiviMedian
          title = "Mediana"
          break;
      case 'Mode':
          funct = ut.getUTObiettiviMode
          title = "Moda"
          break;
      default:
          funct = ut.getUTObiettiviAvg
          title = "Media"
  }
      funct('$'+criteria,years,res).toArray(function (err, data){
        if (err) {
          console.log(err)
          return
        }
        for (index in data){
          // if (data[index]['_id'].aggregazione == filter[criteria])
          partial.push(data[index])
        }
        var res = ut.formatUT(partial," Obiettivi (%) " + title)
        callback(res)
      })
  //   })
  // })
}


function getUTObiettiviByTribunale(metric, tribunale,criteria,years,callback){
  switch(metric) {
      case 'Average':
          funct = ut.getUTObiettiviAvg
          title = "Media"
          break;
      case 'Median':
          funct = ut.getUTObiettiviMedian
          title = "Mediana"
          break;
      case 'Mode':
          funct = ut.getUTObiettiviMode
          title = "Moda"
          break;
      default:
          funct = ut.getUTObiettiviAvg
          title = "Media"
  }

  tr.getTribunaleDetail(tribunale).toArray(function(err,data){
    if (err) {
      console.log(err)
      return
    }
    var filter
    for (index in data){
      filter = data[index]
    }
    partial = []
    funct('$tribunale',years,res).toArray(function (err,data){
      if (err){
        console.log(err)
        return
      }
      for (index in data){
        // console.log(data[index])
        var doc = data[index]
        if (doc['_id'].aggregazione == tribunale){
          partial.push(doc)
        }
      }
      funct('$'+criteria,years,res).toArray(function (err, data){
        if (err) {
          console.log(err)
          return
        }
        for (index in data){
          if (data[index]['_id'].aggregazione == filter[criteria])
            partial.push(data[index])
        }
        var res = ut.formatUT(partial," Obiettivi (%) " + title)
        callback(res)
      })
    })
  })
}

module.exports = router
