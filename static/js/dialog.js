/* Defines a namespace for modal dialogues. 
 *
 * See css/dialog.css and index.html (look for DIV.modalDialog*) for HTML
 * and CSS implementation details.
 *
 * Requires:
 *   js/error.js
 */

// jQuery selectors
var _appPage = $('.appPage');
var _modalDialog = $('#modalDialog');

var Dialog = {
    // Stores a list of queued messages to display to the user
    _queued : [],
    
    _setDialogContent : function (title, content) {
        $('#modalDialogTitle').text(title);
        $('#modalDialogContent').html(content);
    },
    
    _centerVertically : function () {
        // The subtract 15 comes from the padding property of #modalDialog
        var newTop = ($(window).height() / 2) - (_modalDialog.height() / 2) - 15;
        _modalDialog.css('top', newTop + 'px');
    },

    /* Parameters:
     *   config - an Object that contains the following properties:
     *              title : String
     *                The title of the modal dialog
     *
     *              content : HTML
     *                The main content of the modal dialog
     */
    show: function (config) {
        if (config.title === undefined) {
            ErrorMetric.log('Dialog.show: config.title is undefined');
            return false;
        }

        if (config.content === undefined) {
            ErrorMetric.log('Dialog.show: config.content is undefined');
            return false;
        }

        var displayStatus = _modalDialog.css('display');
        if (displayStatus === 'block') {
            Dialog._queued.push(config);
        } else {
            this._setDialogContent(config.title, config.content);

            _appPage.css('pointer-events', 'none');
            
            Dialog._centerVertically();
            _modalDialog.fadeIn();
        }
    }
};

$('#modalDialogClose').click(function () {
    if (Dialog._queued.length > 0) {
        // Fade out and in to denote a new message arrived
        _modalDialog.fadeOut(function () {
            var config = Dialog._queued.shift();
            Dialog._setDialogContent(config.title, config.content);
            
            Dialog._centerVertically();
            _modalDialog.fadeIn();
        });
    } else {
        _modalDialog.fadeOut();
    
        _appPage.css('pointer-events', 'auto');
    }
});

$(window).resize(function () {
    Dialog._centerVertically();
});