$('.nav-btn-js').click(function(){
  $(this).toggleClass('open-burg-js');
  $('.nav-js').toggleClass('open-nav-js');
});

$(document).on('click', function(e) {
  if (!$(e.target).closest('.header-js').length) {
    $('.nav-js').removeClass('open-nav-js');
    $('.nav-btn-js').removeClass('open-burg-js');
  }
  e.stopPropagation();
});


// $('.slider-for').slick({
//   slidesToShow: 1,
//   slidesToScroll: 1,
//   arrows: false,
//   fade: true,
//   asNavFor: '.slider-nav'
// });
// $('.slider-nav').slick({
//   slidesToShow: 3,
//   slidesToScroll: 1,
//   asNavFor: '.slider-for',
//   dots: true,
//   centerMode: true,
//   focusOnSelect: true
// });



