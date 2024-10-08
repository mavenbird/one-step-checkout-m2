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
        'jquery',
        'uiComponent',
        'ko',
        'uiRegistry',
        'mage/translate',
        'Magento_Checkout/js/model/quote',
        'Mavenbird_OneStepCheckout/js/action/validate-shipping-info',
        'Mavenbird_OneStepCheckout/js/model/login-form-validator',
        'Mavenbird_OneStepCheckout/js/action/registration-action',
        'Mavenbird_OneStepCheckout/js/action/osc-loader',
        'Mavenbird_OneStepCheckout/js/action/save-shipping-address',
        'Magento_Checkout/js/action/set-shipping-information',
        'Mavenbird_OneStepCheckout/js/model/shipping-rate-service',
        'Mavenbird_OneStepCheckout/js/action/save-information',
        'Magento_Ui/js/modal/alert',
        'Magento_Checkout/js/checkout-data'
    ],
    function (
        $,
        Component,
        ko,
        registry,
        $t,
        quote,
        ValidateShippingInfo,
        loginFormValidator,
        RegistrationAction,
        Loader,
        SaveAddressBeforePlaceOrder,
        setShippingInformationAction,
        shippingRateService,
        saveInfo,
        alertPopup,
        checkoutData
    ) {
        'use strict';
        return Component.extend({
            defaults: {
                template: 'Mavenbird_OneStepCheckout/onestepcheckout-3column',
                blockName: {
                    shipping_address: "checkout.steps.shipping-step",
                    shipping_method: 'checkout.steps.shippingMethods',
                    payment_method: "checkout.steps.billing-step",
                    order_review: "checkout.steps.order-review"
                },
                allBlocks: {}
            },
            errorMessage: ko.observable(),
            isVirtual:quote.isVirtual,
            isCheckoutEnable: ko.observable(true),
            placingOrder: ko.observable(false),
            initialize: function () {
                this._super();
                var blockInfo = window.checkoutConfig.mdoscBlocks;
                $.each(blockInfo, function (key, item) {
                    var sortOrder = 0;
                    if (item.hasOwnProperty('sortOrder')) {
                        sortOrder = parseInt(item.sortOrder);
                    }
                    this.allBlocks[sortOrder] = {
                        code: item.code,
                        key: key
                    };
                }.bind(this));

                if (window.magentoVersion_osc_patch >= "231" && window.checkoutConfig.paypal_in_context == true) {
                    var selectedPaymentMethod = checkoutData.getSelectedPaymentMethod();
                    if(!selectedPaymentMethod && quote.paymentMethod()) {
                        selectedPaymentMethod = quote.paymentMethod().method;
                    }
                    var btnRegistry = '';
                    if(window.checkoutConfig.place_order_position === 'payment') {
                        btnRegistry = registry.get("checkout.steps.billing-step.payment.payments-list.before-place-order.place-order-button");
                    } else {
                        btnRegistry = registry.get("checkout.before-osc-button.place-order-button");
                    }
                    if(selectedPaymentMethod === 'paypal_express') {
                        if(btnRegistry) {
                            btnRegistry.isBtnVisible(false);
                        }
                    }
                    $(document).on('change', '.payment-method .radio', function () {
                        if ($('.payment-method._active').find('.actions-toolbar').is('#paypal-express-in-context-button')) {
                            if(btnRegistry) {
                                btnRegistry.isBtnVisible(false);
                            }
                        } else {
                            if(btnRegistry) {
                                btnRegistry.isBtnVisible(true);
                            }
                        }
                    });
                }
            },

            startPlaceOrder: function() {
                var self = this;

                if (!quote.paymentMethod()) {
                    this.showErrorAlertMessage('Please select your payment method!');
                    return;
                }
                if(!quote.shippingMethod() && !quote.isVirtual()) {
                    this.showErrorAlertMessage('Please select your shipping method!');
                    return;
                }
                if(!this.validateStorePickup()) {
                    return;
                }
                if(!this.isVirtual() && window.checkoutConfig.delivery_date_enabled) {
                    if(window.checkoutConfig.delivery_date_required) {
                        if ($('input[name="md_osc_delivery_date"]').val() === '' && $('input[name="md_osc_delivery_time"]').val() === '') {
                            this.showErrorAlertMessage('Please choose a delivery date!');
                            return;
                        }
                    }
                }

                var validateBillingAddress = this.updateBillingAddress(quote);
                var validateShippingAddress = this.updateShippingAddress(quote);

                if(validateBillingAddress && validateShippingAddress) {
                    //self.placingOrder(true);
                    Loader.all(true);
                    if(window.checkoutConfig.mdoscAutoRegistrationEnabled) {
                        RegistrationAction();
                    }
                    if(window.checkoutConfig.mdoscRegistrationEnabled &&
                        registry.get("checkout.steps.shipping-step.shippingAddress.customer-email").isRegisterPasswordVisible()
                    ) {
                        if(loginFormValidator.validate()) {
                            RegistrationAction();
                        } else {
                            //self.placingOrder(true);
                            Loader.all(false);
                            return;
                        }
                    }
                    saveInfo().always(function () {
                        self.placeOrder();
                    });

                    //SaveAddressBeforePlaceOrder();
                    //saveInfo().always(function () {
                        //self.placeOrder();
                        // if(self.isVirtual()){
                        //     self.placeOrder();
                        // } else {
                        //     setShippingInformationAction().always(function () {
                        //         shippingRateService().stop(false);
                        //         self.placeOrder();
                        //     })
                        // }
                        // Loader.all(false);
                    //});
                }
            },

            updateBillingAddress: function() {
                var billing;
                if (window.checkoutConfig.displayBillingOnPaymentMethod) {
                    billing = registry.get('checkout.steps.billing-step.payment.payments-list.'
                        + quote.paymentMethod().method
                        + '-form');
                } else {
                    if(window.checkoutConfig.displayBillingAfterShippingAddress) {
                        billing = registry.get("checkout.steps.shipping-step.billing-address-form");
                    } else {
                        billing = registry.get("checkout.steps.billing-step.payment.afterMethods.billing-address-form");
                    }
                }
                if(billing && !billing.isAddressDetailsVisible()) {
                    this.showErrorAlertMessage('Please update your billing address!');
                    return false;
                }
                return true;
            },

            updateShippingAddress: function() {
                return this.isVirtual() ?  true : ValidateShippingInfo();
            },

            validateStorePickup: function () {
                var shippingMethodForm = "#co-shipping-method-form";
                return $(shippingMethodForm).validation() &&
                    $(shippingMethodForm).validation('isValid');
            },

            prepareToPlaceOrder: function(){
                this.startPlaceOrder();
            },

            placeOrder: function () {
                var self = this;
                Loader.all(true);
                var toolBar = jQuery('.payment-method._active .actions-toolbar');
                if (toolBar.length > 1) {
                    _.each(toolBar, function (element) {
                        if (element.style.display !== 'none') {
                            toolBar = jQuery(element);
                            return;
                        }
                    })
                }
                toolBar.find('.action.primary').click();
                /** SaveAddressBeforePlaceOrder(); **/
                // if(this.isVirtual()){
                //     if($("#co-payment-form ._active button[type='submit']").length > 0){
                //         $("#co-payment-form ._active button[type='submit']").click();
                //         self.placingOrder(false);
                //     }
                // }else{
                //     setShippingInformationAction().always(
                //         function () {
                //             shippingRateService().stop(false);
                //             if($("#co-payment-form ._active button[type='submit']").length > 0){
                //                 $("#co-payment-form ._active button[type='submit']").click();
                //                 self.placingOrder(false);
                //             }
                //         }
                //     );
                // }
                // SaveAddressBeforePlaceOrder();
                // saveInfo();
                Loader.all(false);
            },

            validateInformation: function(){
                var shipping = (this.isVirtual()) ? true : ValidateShippingInfo();
                var billing = this.validateBillingInfo();
                return shipping && billing;
            },

            afterRender: function(){
                $('#checkout-loader').removeClass('show');
                $('#ajax-shipping').hide();
                $('#control_overlay_shipping').hide();
                $('#ajax-payment').hide();
                $('#control_overlay_payment').hide();
                $('#ajax-review').hide();
                $('#control_overlay_review').hide();
            },

            validateBillingInfo: function(){
                if($("#co-payment-form ._active button[type='submit']").length > 0){
                    if($("#co-payment-form ._active button[type='submit']").hasClass('disabled')){
                        if($("#co-payment-form ._active button.update-address-button").length > 0){
                            this.showErrorAlertMessage('Please update your billing address!');
                            return;

                        }
                        return false;
                    }else{
                        return true;
                    }
                }
                return false;
            },

            showErrorAlertMessage: function(message){
                alertPopup({
                    content: $t(message),
                    autoOpen: true,
                    clickableOverlay: true,
                    focus: "",
                    actions: {
                        always: function(){

                        }
                    }
                });
            },

            showErrorMessage: function(message){
                var self = this;
                var timeout = 5000;
                self.errorMessage($t(message));
                setTimeout(function(){
                    self.errorMessage('');
                },timeout);
            },

            getBlock: function(index) {
                var allBlock = this.allBlocks[index];
                return this.getComponent(allBlock.code);
            },

            getComponent: function (name) {
                var observable = ko.observable();
                registry.get(name, function (summary) {
                    observable(summary);
                }.bind(this));
                return observable;
            }
        });
    }
);
