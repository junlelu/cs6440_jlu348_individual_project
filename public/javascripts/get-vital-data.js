//const client = FHIR.client("https://apps.hdap.gatech.edu/hapiR4/baseR4/");
const client = FHIR.client("http://hapi.fhir.org/baseR4/");
var patient_name = ["jlu348_patient_4", "cs6440"];

console.log("Test patient name : " + patient_name);
var given_name = patient_name[0];
var family_name = patient_name[1];
// create patient object
var patient_data = defaultPatient();

var query = new URLSearchParams();
query.set("given", given_name);
client.request("Patient?" + query, {
    pageLimit: 0,
    flat: true
}).then(
    function (response) {
        if (response.length === 0) {
            console.log("Did not find the patient: " + given_name);
        } else {
            console.log("Found " + response.length + " patients resources.");
            console.log(response);

            if (response.length > 1) {
                console.log("Using the first found patient.");
            }
            const patient_id = response[0].id;
            var names = response[0].name;
            console.log(names);
            patient_data.given_name.value = names[0].given[0];
            patient_data.family_name.value = names[0].family;
            patient_data.gender.value = response[0].gender;
            patient_data.dob.value = new Date(response[0].birthDate).toLocaleDateString();
            console.log(patient_data);
            displayPatientData(patient_data);
            const query = new URLSearchParams();
            query.set("patient", patient_id);
            query.set("_count", 100);
            query.set("_sort", "-date");
            query.set("code", [
                'http://loinc.org|8867-4',
                'http://loinc.org|8462-4',
                'http://loinc.org|8480-6',
                'http://loinc.org|9279-1',
                'http://loinc.org|8310-5',
                'http://loinc.org|20564-1',
            ].join(","));

            /*
                8867-4 -> heart_rate
                8462-4 -> diastolic_blood_pressure
                8480-6 -> systolic_blood_pressure
                9279-1 -> respiratory_rate
                8310-5 -> temperature
                20564-1 -> oxygen level
            */

            client.request("Observation?" + query, {
                pageLimit: 0,
                flat: true
            }).then(
                function (ob) {
                    console.log("Observation - " + patient_id);
                    if (ob.length === 0) {
                        console.log("Did not find any observation.");
                    } else {
                        console.log("Found " + ob.length + " observations:");
                        console.log(ob);
                        // group all of the observation resources by type into their own
                        var byCodes = client.byCodes(ob, 'code');
                        var heart_rate = byCodes('8867-4');
                        var diastolic_blood_pressure = byCodes('8462-4');
                        var systolic_blood_pressure = byCodes('8480-6');
                        var respiratory_rate = byCodes('9279-1');
                        var temperature = byCodes('8310-5');
                        var oxygen_level = byCodes('20564-1');
                        patient_data.heart_rate.value = heart_rate[0].valueQuantity.value;
                        patient_data.diastolic_blood_pressure.value = diastolic_blood_pressure[0].valueQuantity.value;
                        patient_data.systolic_blood_pressure.value = systolic_blood_pressure[0].valueQuantity.value;
                        patient_data.respiratory_rate.value = respiratory_rate[0].valueQuantity.value;
                        patient_data.body_temperature.value = temperature[0].valueQuantity.value;
                        patient_data.oxygen_level.value = oxygen_level[0].valueQuantity.value;
                        patient_data.time_stamp.value = new Date(temperature[0].effectiveDateTime).toString();
                        console.log(patient_data);

                    }
                    displayPatientData(patient_data);
                }
            );
        }
    }
);
//function to display the observation values you will need to update this
function displayPatientData(data) {
    heart_rate.innerHTML = data.heart_rate.value;
    temperature.innerHTML = data.body_temperature.value;
    diastolic_blood_pressure.innerHTML = data.diastolic_blood_pressure.value;
    systolic_blood_pressure.innerHTML = data.systolic_blood_pressure.value;
    respiratory_rate.innerHTML = data.respiratory_rate.value;
    oxygen_level.innerHTML = data.oxygen_level.value;
    pname.innerHTML = data.family_name.value +", " + data.given_name.value;
    gender.innerHTML = data.gender.value;
    dob.innerHTML = data.dob.value;
    //weight.innerHTML = data.weight.value;
    //height.innerHTML = data.height.value;
    time_stamp.innerHTML = data.time_stamp.value;
}
// create a patient object to initialize the patient
function defaultPatient() {
    return {
        given_name: {
            value: 'undefined'
        },
        family_name: {
            value: 'undefined'
        },
        height: {
            value: 'undefined'
        },
        weight: {
            value: 'undefined'
        },
        dob: {
            value: 'undefined'
        },
        gender: {
            value: 'undefined'
        },
        heart_rate: {
            value: 'undefined'
        },
        diastolic_blood_pressure: {
            value: 'undefined'
        },
        systolic_blood_pressure: {
            value: 'undefined'
        },
        body_temperature: {
            value: 'undefined'
        },
        respiratory_rate: {
            value: 'undefined'
        },
        oxygen_level: {
            value: 'undefined'
        },
        time_stamp: {
            value: 'undefined'
        },
    };
}

function displayVital(obs) {
    hdl.innerHTML = obs.hdl;
    ldl.innerHTML = obs.ldl;
    sys.innerHTML = obs.sys;
    dia.innerHTML = obs.dia;
    height.innerHTML = obs.height;
    weight.innerHTML = obs.weight;
}

function create_vital_observation(ob) {
    client.create(ob).then(
        function (ob) {
            console.log(ob);
        }
    );
}

function generate_vital_sign_observation_json(data, patient_id) {
    var time = new Date().toISOString();
    const observation_json = {
        resourceType: 'Observation',
        category: [
            {
                coding: [
                    {
                        system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                        code: 'vital-signs',
                        display: 'Vital Signs',
                    },
                ],
                text: 'Vital Signs',
            },
        ],
        code: {
            coding: [
                {
                    system: 'http://loinc.org',
                    code: data.code,
                    display: data.text,
                },
            ],
            text: data.text,
        },
        subject: {
            reference: `Patient/${patient_id}`,
        },
        effectiveDateTime: time,
        valueQuantity: {
            value: data.value,
            unit: data.unit,
            system: "https://unitsofmeasure.org"
        },
    };
    return observation_json;
}

