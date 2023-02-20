// db.user.find().snapshot().forEach( function (hombre) {
//     hombre.name = hombre.firstName + ' ' + hombre.lastName;
//     db.person.save(hombre);
// });
// use epitrack;

function checkAgeGroup(age){
        if (age >= 13 && age <= 19){
            rangeAge = "13_19";
        }else if (age >= 20 && age <= 29){
            rangeAge = "20_29";
        }else if (age >= 30 && age <= 39){
            rangeAge = "30_39";
        }else if (age >= 40 && age <= 49){
            rangeAge = "40_49";
        }else if (age >= 50 && age <= 59){
            rangeAge = "50_59";
        }else if (age >= 60 && age <= 69){
            rangeAge = "60_69";
        }else if (age >= 70 && age <= 79){
            rangeAge = "70_79";
        }else if (age > 80){
            rangeAge = "80";
        }
        return rangeAge;
}
//add ageGroup
function calcAge(dob) {
		// returns age group
    if (dob == "undefined"){
        return 0;
    }
    var ageDifMs = Date.now() - dob.getTime();
    var ageDate = new Date(ageDifMs); // miliseconds from epoch
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}

db.user.find().snapshot().forEach( function (user) {
    user.ageGroup = checkAgeGroup(user.age)
    db.user.save(user);
});

db.user.find().snapshot().forEach( function (user) {
    user.age = calcAge(user.dob)
    db.user.save(user);
});

db.user.find().snapshot().forEach( function (user) {
    /*
    0:Atleta/Delegação,
    1:Trabalhador/Voluntário,
    2:Fã/Espectador
    */
    user.role = Math.floor((Math.random() * 3) + 1);
    db.user.save(user);
});

db.user.find().snapshot().forEach( function (user) {
    user.level = Math.floor((Math.random() * 10) + 1);
    db.user.save(user);
});

db.user.find().snapshot().forEach( function (user) {
    user.country = "Brazil";
    db.user.save(user);
});

db.survey.aggregate(
    [
     {
        $match: { $and : [ {createdAt: {$gte: firstDay}, city: "Recife"}]},
     },
     {$project: {user: 1, createdAt:1, lat: 1, lon: 1}},
     { $sort: { user: 1, createdAt: 1 } },
     {
       $group:
         {
           _id: "$user",
           lastSurveyDate: { $last: "$createdAt" },
           lat: { $last: "$lat" },
           lon: { $last: "$lon" }
         }
     }
   ]
)


db.survey.aggregate(
    [
     {
       $group:
         {
           _id: "$platform",
           total: {$sum: 1}
         }
     }
   ]
)
//get survey qtd by day
db.survey.aggregate(
{
    "$project": {
        year: {$year: "$createdAt"},
        month: {$month: "$createdAt"},
        day: {$dayOfMonth: "$createdAt"},
        user: "$user"
    }
},
  {
    $group: {
      _id: {day: "$day", month: "$month", year: "$year"},
      count: {$sum: 1}
    }
  },
  {$sort: {count: -1}}
)
