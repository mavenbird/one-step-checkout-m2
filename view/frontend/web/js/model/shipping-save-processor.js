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

define(
    [
        'Mavenbird_OneStepCheckout/js/model/shipping-save-processor/default'
    ],
    function(defaultProcessor) {
        'use strict';
        var processors = [];
        processors['default'] =  defaultProcessor;

        return {
            registerProcessor: function(type, processor) {
                processors[type] = processor;
            },
            saveShippingInformation: function (type) {
                var rates = [];
                if (processors[type]) {
                    rates = processors[type].saveShippingInformation();
                } else {
                    rates = processors['default'].saveShippingInformation();
                }
                return rates;
            }
        }
    }
);
