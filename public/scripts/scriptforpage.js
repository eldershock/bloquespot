autosize($('.form-control'));

let widthVideo = $(".video").width();
let heightVideo = $(".video").height();

if($(".video").position() >= $(".wall_text").position()){
  $(".video").width(widthVideo - 50);
}

function imageChange(field) {
  if(field.files[0].type.match('image.*')){
    document.getElementById("changeAvaButton").style.display = "block";
  }else{
    document.getElementById("changeAvaButton").style.display = "none";
  }
}
