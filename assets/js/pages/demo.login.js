const email = $('#email');
const password = $('#password');
const button = $('#login');
const buttonText = button.find('#title');
const buttonSpinner = button.find('#spinner');

$(document).ready(function() {
   buttonSpinner.hide()
   if(isAuthenticated()){
      window.location.href = './todo.html';
   }

   $('#login').on('click', function() {
      login();
  });
});

function login(){
   button.prop('disabled', true);
   buttonText.text('');
   buttonSpinner.show();

   $.ajax({
      url: `${ baseUrl }/sanctum/csrf-cookie`,
      type: 'GET',
      success: function (response) {
         try {
            $.ajax({
               url: `${ baseUrl }/api/login`,
               type: 'POST',
               dataType: 'json',
               data: { email: email.val(), password: password.val() },
               success: function (res) {
                  localStorage.setItem('name', res.user.name)
                  localStorage.setItem('token', res.token)
                  localStorage.setItem('auth', 'true')

                  setTimeout(function () {
                     window.location.href = './todo.html';
                     button.prop('disabled', false);
                     buttonText.text('Log In');
                     buttonSpinner.hide();
                  }, 3000);
               },
               error: function (xhr, status, error) {
                  const status_code = xhr.status;
                  const errors = xhr.responseJSON.error;
                  $('#account-error').text('');
                  $('.error-message').text('');

                  switch (status_code) {
                     case 401:
                        $('#account-error').text(errors);
                     break;
                     case 422:
                        $('.error-message').text('');
                        Object.entries(errors).forEach(([field, messages]) => {
                           $(`#${field}-error`).text(messages[0]);
                        });
                     break;
                  
                     default:
                     break;
                  }

                  button.prop('disabled', false);
                  buttonText.text('Log In');
                  buttonSpinner.hide();
               }
            });
         } catch (error) {
            console.log(error)
         }

      },
      error: function (error) {
          console.error('Error:', error);
      }
  });
}
