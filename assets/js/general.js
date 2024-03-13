const baseUrl = 'http://127.0.0.1:8000';
const token = localStorage.getItem('token');
const names = localStorage.getItem('name');

$(document).ready(function() {
   // Retrieve CSRF token from the server
   $.get(`${ baseUrl }/api/csrf-token`, function(response) {
      $('meta[name="csrf-token"]').attr('content', response.csrf_token);

      // Set up CSRF token for all subsequent AJAX requests
      $.ajaxSetup({
         headers: {
            'X-CSRF-TOKEN': response.csrf_token,
         }
      });
   });
   $('#user-name').text(names)
});

function isAuthenticated() {
   const authStatus = localStorage.getItem('auth');
   return authStatus === 'true';
}

function logout(){
   $.ajax({
      url : `${ baseUrl }/api/logout`,
      type : 'GET',
      dataType : 'json',
      headers:{
         'Authorization':`Bearer ${ token }`,
      },
      success: function (res) {
         setTimeout(function() {
            window.location.href = './index.html';
         }, 3000);

         localStorage.removeItem('name');
         localStorage.removeItem('token');
         localStorage.removeItem('auth');
      },
      error: function(xhr, status, error) {
         console.log(xhr.responseJSON.errors);
         $('#staticBackdrop').modal('hide')
      }
   });
}