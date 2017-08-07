/**
 editable input for Wareki(和暦) date.
 Requirements: jquery, moment

 @class wareki
 @extends abstractinput
 @final
 @example
 <a href="#" id="wareki" data-type="wareki" data-pk="1" data-value="2017/08/06"></a>
 <a href="#" id="wareki" data-type="wareki" data-pk="1">平成29年8月6日</a>
 <script>
 $(function(){
    $('#wareki').editable({
        url: '/post',
        type: 'wareki',
        pk: 1,
        name: 'date',
        title: '年月日を入力してください。',
        value: '2017/08/06'
    });
});
 </script>
 **/
(function ($) {
    "use strict";

    var Wareki = function (options) {
        this.init('wareki', options, Wareki.defaults);
    };

    $.fn.editableutils.inherit(Wareki, $.fn.editabletypes.abstractinput);

    $.extend(Wareki.prototype, {

        eraCollection: {
            heisei: {name: '平成', startYear: 1989, endYear: moment().format('YYYY')},
            showa: {name: '昭和', startYear: 1926, endYear: 1989},
            taisho: {name: '大正', startYear: 1912, endYear: 1926},
            meiji: {name: '明治', startYear: 1868, endYear: 1912}
        },
        render: function() {

            var self = this;
            this.$input = this.$tpl.find('select');

            if($.fn.editableform.engine === 'bs3') {
                this.$tpl.find('select').addClass('form-control');
            }

            if(this.options.inputclass) {
                this.$tpl.find('select').addClass(this.options.inputclass);
            }

            this.$input.on('change', function(){

                var name = $(this).attr('name');
                var eraKey = $(this).val();

                if(name == 'era_name') {

                    self.refreshYearOptions(eraKey);

                }

            });

            if(this.options.clear) {
                this.$clear = $('<a href="#"></a>').html(this.options.cleartext).click($.proxy(function(e){
                    e.preventDefault();
                    e.stopPropagation();
                    this.clear();
                }, this));

                this.$tpl.parent().parent().append($('<div class="editable-clear">').append(this.$clear));
            }
        },
        value2html: function(value, element) {

            if(typeof value == 'string') {

                var dt = moment(value, this.dateParseFormats);
                value = {
                    year: dt.year(),
                    month: dt.month()+1,
                    day: dt.date()
                }

            }

            if(!value.year || !value.month || !value.day) {
                $(element).empty();
                return;
            }
            value = this.eraDate(value);
            var html = value.eraName + value.eraYear +'年'+ value.month +'月'+ value.day +'日';
            $(element).html(html);
        },
        html2value: function(html) {

            var eraNames = [];

            for(var key in this.eraCollection) {

                eraNames.push(this.eraCollection[key].name);

            }

            var regex = new RegExp('('+ eraNames.join('|') +')([0-9]+)年([0-9]+)月([0-9]+)日');
            var matches = html.match(regex);

            if(matches) {

                var eraKey = this.eraName2Key(matches[1]);
                var eraYear = matches[2];
                var year = this.era2Year(eraKey, eraYear);
                html = year +'/'+ matches[3] +'/'+ matches[4];

            }

            var dt = moment(html, this.dateParseFormats);
            return {
                year: dt.year(),
                month: dt.month(),
                day: dt.date()
            }
        },
        value2str: function(value) {
            var str = '';
            if(value) {
                for(var k in value) {
                    str = str + k + ':' + value[k] + ';';
                }
            }
            return str;
        },
        value2input: function(value) {
            if(!value) {
                return;
            }
            value = this.eraDate(value);
            this.refreshYearOptions(value.eraKey);
            this.$input.filter('[name="era_name"]').val(value.eraKey);
            this.$input.filter('[name="year"]').val(value.eraYear);
            this.$input.filter('[name="month"]').val(value.month);
            this.$input.filter('[name="day"]').val(value.day);
        },
        input2value: function() {
            var eraKey = this.$input.filter('[name="era_name"]').val();
            var eraYear = this.$input.filter('[name="year"]').val();
            var month = this.$input.filter('[name="month"]').val();
            var day = this.$input.filter('[name="day"]').val();

            return {
                year: this.era2Year(eraKey, eraYear),
                month: month,
                day: day
            };
        },
        value2submit: function(value) {

            var clearFlag = 0;

            if(!value.year && !value.month && !value.day) {

                clearFlag = 1;

            }

            value.clear = clearFlag;
            value.date = value.year +'-'+ value.month +'-'+ value.day;
            return value;

        },
        eraNameOptionTags: function() {

            var options = [this.optionTag('', '')];

            for(var key in this.eraCollection) {

                var eraName = this.eraCollection[key]['name'];
                options.push(this.optionTag(key, eraName));

            }

            return options;

        },
        yearOptionTags: function(eraKey) {

            var options = [this.optionTag('', '')];

            if(eraKey) {

                var era = this.eraCollection[eraKey];
                var startYear = era.startYear;
                var endYear = era.endYear;
                var maxYear = endYear - startYear + 1;

                for(var i=1 ; i<=maxYear ; i++) {

                    options.push(this.optionTag(i, i));

                }

            }

            return options;

        },
        monthOptionTags: function() {

            var options = [this.optionTag('', '')];

            for(var i=1 ; i<= 12 ; i++) {

                options.push(this.optionTag(i, i));

            }

            return options;

        },
        dayOptionTags: function() {

            var options = [this.optionTag('', '')];

            for(var i=1 ; i<= 31 ; i++) {

                options.push(this.optionTag(i, i));

            }

            return options;

        },
        optionTag: function(value, text) {

            return '<option value="'+ value +'">'+ text +'</option>'

        },
        era2Year: function(eraKey, eraYear) {

            if(!eraKey || !eraYear) {

                return '';

            }

            var startYear = this.eraCollection[eraKey].startYear;
            return parseInt(startYear)+parseInt(eraYear)-1;

        },
        eraName2Key: function(eraName) {

            for(var key in this.eraCollection) {

                var targetName = this.eraCollection[key].name;

                if(targetName == eraName) {

                    return key;

                }

            }

        },
        eraDate: function(value) {

            if(typeof value == 'object') {

                value = value.year +'-'+ value.month +'-'+ value.day;

            }

            var dt = moment(value, this.dateParseFormats);
            var eraKey = '';
            var eraName = '';
            var eraYear = -1;
            var year = dt.year();

            for(var key in this.eraCollection) {

                var targetYear = this.eraCollection[key].startYear - 1;

                if(year > targetYear) {

                    eraKey = key;
                    eraName = this.eraCollection[key].name;
                    eraYear = (year-targetYear);
                    break;

                }

            }

            return {
                eraKey: eraKey,
                eraName: eraName,
                eraYear: eraYear,
                month: dt.month()+1,
                day: dt.date()
            };

        },
        refreshYearOptions: function(eraKey) {

            var optionHtml = this.yearOptionTags(eraKey);
            this.$tpl.find('[name=year]').empty().html(optionHtml);

        },
        dateParseFormats: [
            'YYYY-MM-DD',
            'YYYY/MM/DD',
            'YYYY-M-D',
            'YYYY/M/D'
        ]
    });

    Wareki.defaults = $.extend({}, $.fn.editabletypes.abstractinput.defaults, {
        tpl: [
            '<div class="editable-wareki">',
            '<select type="text" name="era_name">'+ Wareki.prototype.eraNameOptionTags().join('') +'</select>&nbsp;&nbsp;',
            '<select type="text" name="year">'+ Wareki.prototype.yearOptionTags().join('') +'</select>&nbsp;年&nbsp;&nbsp;',
            '<select type="text" name="month">'+ Wareki.prototype.monthOptionTags().join('') +'</select>&nbsp;月&nbsp;&nbsp;',
            '<select type="text" name="day">'+ Wareki.prototype.dayOptionTags().join('') +'</select>&nbsp;日&nbsp;',
            '</div>'
        ].join(''),
        inputclass: '',
        clear: false,
        cleartext: '× clear'
    });
    $.fn.editabletypes.wareki = Wareki;

}(window.jQuery));