var userArray = [
		"Jabari",
		"Jabir",
		"Jace",
		"Jacen",
		"Jack",
		"Jackson",
		"Jacob",
		"Jacoby",
		"Jacques",
		"Jacy",
		"Jadako",
		"Jaden",
		"Jadolf",
		"Jadon",
		"Jaedon",
		"Jaeger",
		"Jafar",
		"Jagger",
		"Jahdai",
		"Jahmal",
		"Jahmir",
		"Jai boy",
		"Jaidev",
		"Jaime",
		"Jakacia",
		"Jake",
		"Jakob"
	];

var userObjsArray = [
        {"USERNAME":"Jabar2","FIRSTNAME":"Jabari"},
        {"USERNAME":"Jabir6","FIRSTNAME":"Jabir"},
        {"USERNAME":"Jace6","FIRSTNAME":"Jace"},
        {"USERNAME":"Jacen7","FIRSTNAME":"Jacen"},
        {"USERNAME":"Jack7","FIRSTNAME":"Jack"},
        {"USERNAME":"Jacks2","FIRSTNAME":"Jackson"},
        {"USERNAME":"Jacob5","FIRSTNAME":"Jacob"},
        {"USERNAME":"Jacob7","FIRSTNAME":"Jacoby"},
        {"USERNAME":"Jacqu2","FIRSTNAME":"Jacques"},
        {"USERNAME":"Jacy4","FIRSTNAME":"Jacy"},
        {"USERNAME":"Jadak1","FIRSTNAME":"Jadako"},
        {"USERNAME":"Jaden2","FIRSTNAME":"Jaden"},
        {"USERNAME":"Jadol6","FIRSTNAME":"Jadolf"},
        {"USERNAME":"Jadon6","FIRSTNAME":"Jadon"},
		{"USERNAME":"Jaedo7","FIRSTNAME":"Jaedon"},
		{"USERNAME":"Jaege2","FIRSTNAME":"Jaeger"},
		{"USERNAME":"Jafar4","FIRSTNAME":"Jafar"},
		{"USERNAME":"Jagge7","FIRSTNAME":"Jagger"},
		{"USERNAME":"Jahda5","FIRSTNAME":"Jahdai"},
		{"USERNAME":"Jahma1","FIRSTNAME":"Jahmal"},
		{"USERNAME":"Jahmi3","FIRSTNAME":"Jahmir"},
		{"USERNAME":"Jaibo5","FIRSTNAME":"Jai boy"},
		{"USERNAME":"Jaide6","FIRSTNAME":"Jaidev"},
		{"USERNAME":"Jaime2","FIRSTNAME":"Jaime"},
		{"USERNAME":"Jakac4","FIRSTNAME":"Jakacia"},
		{"USERNAME":"Jake2","FIRSTNAME":"Jake"},
		{}
	];


var userObjsRenArray = [];

var randomXToY = function (min,max) {
	var range = max - min + 1;
	return Math.floor(Math.random()*range+min);
}

$.each(userObjsArray, function(index, user) {
	userObjsRenArray.push({
		"USERNAME": user.USERNAME,
		"FIRSTNAME": user.FIRSTNAME,
		"autoCompleteDisplay":"<img src='./images/32 (" + randomXToY(0, 9) + ").png'/> " + user.FIRSTNAME + "(" + user.USERNAME + ")" 
	});
});
