/**
 * Mavenbird Technologies Private Limited
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the EULA
 * that is bundled with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://mavenbird.com/Mavenbird-Module-License.txt
 *
 * =================================================================
 *
 * @category   Mavenbird
 * @package    Mavenbird_OneStepCheckout
 * @author     Mavenbird Team
 * @copyright  Copyright (c) 2018-2024 Mavenbird Technologies Private Limited ( http://mavenbird.com )
 * @license    http://mavenbird.com/Mavenbird-Module-License.txt
 */

define([
    'jquery',
    'ko',
    'uiComponent'
], function ($, ko, Component) {
    'use strict';

    return Component.extend({
        defaults: {
            template: 'Mavenbird_OneStepCheckout/delivery-date'
        },
        availableDates: ko.observableArray(),
        selectedSwatchDate:ko.observable(""),
        selectedSwatchTime:ko.observable(""),
        isRequired:ko.observable(true),
        timeSlot : ko.observableArray(),
        isShowDeliveryComment: ko.observable(window.checkoutConfig.delivery_date_comment),
        addClass: ko.observable('time'),
        isVisibleDelivery: ko.observable(true),
        initialize: function () {
            this._super();
            this.getTimeSlot();
        },
        getTimeSlot: function() {
            var timeObject = window.checkoutConfig.delivery_date_timeslot ? window.checkoutConfig.delivery_date_timeslot : '';
            if(timeObject)
            {
                var timeArray = Object.values(timeObject);
                this.availableDates(timeArray);
                this.timeSlot(timeArray);
            }
        },

        getFormatDate: function(data) {
            var months = ["Jan", "Feb", "Mar","Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            var unixDate = data.unix_date;
            var newDate = new Date(unixDate*1000);
            return newDate.getDate() + " " + months[newDate.getMonth()] + " " + newDate.getFullYear();
        },

        selectedDate: function (data,event) {
            var element = event.target;
            var day = element.getAttribute('day');
            var date = element.getAttribute('date');
            var time = data;
            $('input[name="md_osc_delivery_date"]').val(date).change();
            $('input[name="md_osc_delivery_time"]').val(time).change();
            $('.delivery-date-time.active').removeClass('active');
            $(element).addClass("active");
            return true;
        },
    });
});
