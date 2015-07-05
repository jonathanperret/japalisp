var Jexer = {};

Jexer.tokenizeWhole = function(code){
  var tokens;
  tokens = code.split(/。|！/).reduce(function(acc,sentence){
    var partial_tokens = Jexer.tokenizeSentence(sentence);
    if(JSON.stringify(partial_tokens) !== '[[""]]'){
      acc.push(partial_tokens);
    }
    return acc
  },[]);
  return tokens
}

Jexer.tokenizeSentence = function(sentence){
  return sentence.split(/\s+/).map(Jexer.tokenize);
}

Jexer.tokenize = function(line){
  if(line === undefined) return [];
  if(line === []) return [];

  // we prioritize a suffix with delimiter
  var determine_splitter = function(str, suffix, delimiter){
    if(str.indexOf(suffix + delimiter) > 0){
      return suffix + delimiter
    }else{
      return suffix
    }
  };

  var rest;
  if( line.match(/^(.*)っていうのは/) ){
    rest = RegExp.$1;
    return ["DEFINE"].concat(Jexer.tokenize(rest));
  }else if( line.match(/^もし(.*?)(?:だったら|なら)(.*)$/) ){
    var predicate = RegExp.$1,
        body = RegExp.$2;
    return ["IF",
      Jexer.tokenize(predicate),
      Jexer.tokenize(body)
    ]
  }else if( line.match(/それ以外(だったら|なら)、?$/) ){
    return ["ELSE"]
  }else if( line.match(/^(.*)を使って/) ){
    rest = RegExp.$1;
    return Jexer.tokenize(rest);
  }else if( line.match(/^(.*)を(返す|返して|教えてね?)/) ){
    rest = RegExp.$1;
    return Jexer.tokenize(rest);
  }else if( line.match(/^(?:(.*)で)?(.+)を(計算)?し(続け(てね|るんだよ)?|た(結果|もの))$/)){
    var id = RegExp.$2,
        args = RegExp.$1;
    var splitter = determine_splitter(args, "と", "、");
    var argTokens = args.split(splitter).map(Jexer.tokenize);
    return [id].concat(argTokens);
  }else if( line.match(/^(.*)をかけ(てみて|た(結果|もの))$/) ){
    rest = RegExp.$1;
    var splitter = determine_splitter(rest, "と", "、");
    var argTokens = rest.split(splitter).map(Jexer.tokenize);
    return ["*"].concat(argTokens);
  }else if( line.match(/^(.*)を足し(てみて|た(もの|数))$/) ){
    rest = RegExp.$1;
    var splitter = determine_splitter(rest, "に", "、");
    var argTokens = rest.split(splitter).map(Jexer.tokenize);
    return ["+"].concat(argTokens);
  }else if( line.match(/^(.*)で一つ増やした数$/) ){
    rest = RegExp.$1;
    return ["+", Jexer.tokenize(rest), [1]];
  }else if( line.match(/^(.*)で一つ減らした数$/) ){
    rest = RegExp.$1;
    return ["-", Jexer.tokenize(rest), [1]];
  }else if( line.match(/^(.*)を引い(てみて|た(もの|数))$/) ){
    rest = RegExp.$1;
    var splitter = determine_splitter(rest, "から", "、");
    var argTokens = rest.split(splitter).map(Jexer.tokenize);
    return ["-"].concat(argTokens);
  }else if( line.match(/^(.*)してみて/) ){
    rest = RegExp.$1;
    return Jexer.tokenize(rest);
  }else if( line.match(/その/) ){
    var rest = line.replace(/その/g,'');
    return Jexer.tokenize(rest);
  }else if( line.match(/^「(.*)」$/)){
    return ["STR", RegExp.$1]
  }else if( line.match(/^(.*)が(.*)$/) ){
    return ["==", Jexer.tokenize(RegExp.$1), Jexer.tokenize(RegExp.$2)]
  }else if( line.match(/^(.*)で(.*)$/) ){
    var identifier = RegExp.$2;
    var rest = RegExp.$1;
    var argTokens = rest.split(/と、?/).map(Jexer.tokenize);
    return Jexer.tokenize(identifier).concat(argTokens);
  }else if( line.match(/と、?/) ){
    return line.split(/と、?/).reduce(function(accu,partial_line){
      return accu.concat(Jexer.tokenize(partial_line));
    },[]);
  }else if( line.match(/[０-９]+/) ){
    var singleByte = line.replace(/[０-９]/g,function(s){return String.fromCharCode(s.charCodeAt(0)-0xFEE0)})
    return [parseInt(singleByte.match(/[0-9]+/))]
  }else if( line.match(/[0-9]+/) ){
    return [parseInt(line.match(/[0-9]+/))]
  }else{
    return [line];
  }

};
