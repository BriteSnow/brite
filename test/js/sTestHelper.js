function showTestSources(){
	$(".sTestSrc.sTestShowSrc").each(function(){
		var $sTestSrc = $(this);
		
		$sTestSrc.after("<h3>Source</h3><textarea class='sTestSrcTA'></textarea>");
		$sTestSrc.nextAll("textarea:first").val($sTestSrc.html());
	});
}

function log(txt){
	if (console){
		console.log(txt);
	}
}
