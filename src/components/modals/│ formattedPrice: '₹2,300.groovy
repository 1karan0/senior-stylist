                      │ formattedPrice: '₹2,300.00',
                             │ priceAmountMicros: '2300000000',
                             │ priceCurrencyCode: 'INR',
                             │ recurrenceMode: 1 } ] } },
                             │ { basePlanId: 'premium-monthly',
                             │ offerTags: [],
                             │ offerToken: 'ATdH1CNzejMBkiPyeBD0ElDlNuMPfhHAp6aEYyEMZOvLIhpdSyJAUeudGpk+fbqe4sWoNElenMwNm9si/AN8qm5MgVnwK5Q=',
                             │ pricingPhases:
                             │ { pricingPhaseList:
                             │ [ { billingCycleCount: 0,
                             │ billingPeriod: 'P1M',
                             │ formattedPrice: '₹2,850.00',
                             │ priceAmountMicros: '2850000000',
                             │ priceCurrencyCode: 'INR',
                             └ recurrenceMode: 1 } ] } } ]

[14:43:04] I | ReactNativeJS ▶︎ '[SubscriptionModal][DEBUG] offers FULL JSON (unmodified)', '[\n  {\n    "basePlanId": "basic-monthly",\n    "offerTags": [],\n    "offerToken": "ATdH1CNTeI02fOxO7ay5rhoC1OAru+TkZCn2Gv/HXfkYKduCXfVBnEfwh8fzF281MaThMrklFY6I0ymepjHNR5F/ueTZoVM=",\n    "pricingPhases": {\n      "pricingPhaseList": [\n        {\n          "billingCycleCount": 0,\n          "billingPeriod": "P1M",\n          "formattedPrice": "₹1,700.00",\n          "priceAmountMicros": "1700000000",\n          "priceCurrencyCode": "INR",\n          "recurrenceMode": 1\n        }\n      ]\n    }\n  },\n  {\n    "basePlanId": "pro-monthly",\n    "offerTags": [],\n    "offerToken": "ATdH1CN8Qzo5hWoT5Svs4omtSDrDAohBLsqkMJ63GI7lKGewOeCCEeYSSISQOMkguXEqsse9ZQjhuAMMci5VRrb9mw==",\n    "pricingPhases": {\n      "pricingPhaseList": [\n        {\n          "billingCycleCount": 0,\n          "billingPeriod": "P1M",\n          "formattedPrice": "₹2,300.00",\n          "priceAmountMicros": "2300000000",\n          "priceCurrencyCode": "INR",\n          "recurrenceMode": 1\n        }\n      ]\n    }\n  },\n  {\n    "basePlanId": "premium-monthly",\n    "offerTags": [],\n    "offerToken": "ATdH1CNzejMBkiPyeBD0ElDlNuMPfhHAp6aEYyEMZOvLIhpdSyJAUeudGpk+fbqe4sWoNElenMwNm9si/AN8qm5MgVnwK5Q=",\n    "pricingPhases": {\n      "pricingPhaseList": [\n        {\n          "billingCycleCount": 0,\n          "billingPeriod": "P1M",\n          "formattedPrice": "₹2,850.00",\n          "priceAmountMicros": "2850000000",\n          "priceCurrencyCode": "INR",\n          "recurrenceMode": 1\n        }\n      ]\n    }\n  }\n]'

[14:43:04] I | ReactNativeJS ▶︎ '[SubscriptionModal][DEBUG] offers raw shape', { fetchMethod: 'fetchProducts',
                             │ offersCount: 3,
                             │ offers:
                             │ [ { basePlanId: 'basic-monthly',
                             │ offerId: undefined,
                             │ hasOfferIdKey: false,
                             │ offerTokenPreview: 'ATdH1CNTeI02fOxO…',
                             │ keys: [ 'basePlanId', 'offerTags', 'offerToken', 'pricingPhases' ],
                             │ pricingPhasesCount: 1,
                             │ firstPhase:
                             │ { formattedPrice: '₹1,700.00',
                             │ billingPeriod: 'P1M',
                             │ billingCycleCount: 0,
                             │ recurrenceMode: 1 } },
                             │ { basePlanId: 'pro-monthly',
                             │ offerId: undefined,
                             │ hasOfferIdKey: false,
                             │ offerTokenPreview: 'ATdH1CN8Qzo5hWoT…',
                             │ keys: [ 'basePlanId', 'offerTags', 'offerToken', 'pricingPhases' ],
                             │ pricingPhasesCount: 1,
                             │ firstPhase:
                             │ { formattedPrice: '₹2,300.00',
                             │ billingPeriod: 'P1M',
                             │ billingCycleCount: 0,
                             │ recurrenceMode: 1 } },
                             │ { basePlanId: 'premium-monthly',
                             │ offerId: undefined,
                             │ hasOfferIdKey: false,
                             │ offerTokenPreview: 'ATdH1CNzejMBkiPy…',
                             │ keys: [ 'basePlanId', 'offerTags', 'offerToken', 'pricingPhases' ],
                             │ pricingPhasesCount: 1,
                             │ firstPhase:
                             │ { formattedPrice: '₹2,850.00',
                             │ billingPeriod: 'P1M',
                             │ billingCycleCount: 0,
                             └ recurrenceMode: 1 } } ] }

[14:43:04] I | ReactNativeJS ▶︎ '[SubscriptionModal][DEBUG] selectedOffer details', { basePlanId: 'premium-monthly',
                             │ desiredOfferPlanId: 'premium-intro-6m',
                             │ selectedOfferBasePlanId: 'premium-monthly',
                             │ selectedOfferOfferId: undefined,
                             │ hasOfferIdKey: false,
                             │ selectedOfferKeys: [ 'basePlanId', 'offerTags', 'offerToken', 'pricingPhases' ],
                             │ selectedOfferTokenPreview: 'ATdH1CNzejMBkiPy…',
                             │ selectedOfferRaw:
                             │ { basePlanId: 'premium-monthly',
                             │ offerTags: [],
                             │ offerToken: 'ATdH1CNzejMBkiPyeBD0ElDlNuMPfhHAp6aEYyEMZOvLIhpdSyJAUeudGpk+fbqe4sWoNElenMwNm9si/AN8qm5MgVnwK5Q=',
                             │ pricingPhases:
                             │ { pricingPhaseList:
                             │ [ { billingCycleCount: 0,
                             │ billingPeriod: 'P1M',
                             │ formattedPrice: '₹2,850.00',
                             │ priceAmountMicros: '2850000000',
                             │ priceCurrencyCode: 'INR',
                             └ recurrenceMode: 1 } ] } } }
