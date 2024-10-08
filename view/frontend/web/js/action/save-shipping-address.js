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
        'underscore',
        'jquery',
        'Magento_Customer/js/model/address-list',
        'Magento_Checkout/js/model/quote',
        'Magento_Checkout/js/model/address-converter',
        'Magento_Customer/js/model/customer',
        'Magento_Checkout/js/action/select-shipping-address',
        'uiRegistry',
        'Mavenbird_OneStepCheckout/js/model/shipping-rate-service',
        'Mavenbird_OneStepCheckout/js/model/billing-address-state',
        'Magento_Checkout/js/action/select-billing-address'
    ],
    function (
        _,
        $,
        addressList,
        quote,
        addressConverter,
        customer,
        selectShippingAddress,
        registry,
        shippingRateService,
         BillingAddressState,
        selectBillingAddressAction
    ) {
        'use strict';
        return function () {
            if(addressList().length == 0){
                var shippingAddress = quote.shippingAddress();
                registry.async('checkoutProvider')(function (checkoutProvider) {
                    var addressData = addressConverter.formAddressDataToQuoteAddress(
                        checkoutProvider.get('shippingAddress')
                    );
                    for (var field in addressData) {
                        if (addressData.hasOwnProperty(field) &&
                            shippingAddress.hasOwnProperty(field) &&
                            typeof addressData[field] != 'function' &&
                            _.isEqual(shippingAddress[field], addressData[field])
                        ) {
                            shippingAddress[field] = addressData[field];
                        } else if (typeof addressData[field] != 'function' &&
                            !_.isEqual(shippingAddress[field], addressData[field])) {
                            shippingAddress = addressData;
                            break;
                        }
                    }
                    if (customer.isLoggedIn()) {
                        shippingAddress.save_in_address_book = 1;
                    }
                    shippingRateService().stop(true);
                    selectShippingAddress(shippingAddress);
                    if (BillingAddressState.sameAsShipping() == true) {
                        selectBillingAddressAction(shippingAddress);
                    }
                });
            }
        };
    }
);
