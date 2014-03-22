function assertNull(testName,val,valName){
	if (val === null || typeof val === "undefined"){
		addResult("__ok__ " + testName);
	}else{
		addResult("FAILED " + testName + " value " + (valName || "") + " is not null '" + val + "' (it should be null or undefined)");
	}

}

function assertNotNull(testName,val,valName){
	if (val === null || typeof val === "undefined"){
		addResult("FAILED value " + (valName || "") + " was null");
	}else{
		addResult("__ok__ " + testName);
	}
}

function assertEqual(testName,expected,actual){
	if (expected === actual){
		addResult("__ok__ " + testName);
	}else{
		addResult("FAILED " + testName + " expected: " + expected + " got: " + actual);
	}
}

function addResult(txt){
	var $userList = $("#testList");
	$userList.append("<li>" + txt + "</li>");
}	