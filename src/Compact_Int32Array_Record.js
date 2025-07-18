

const DEFAULT_RECORD_TYPE = 64;


const min_valid_record_length = 3;   //[length, type, bitfield]

// And parsers?
//   Though they may / will be specific for specific record types.

const {tof} = require('lang-mini');
//const sta_record_get = require('./places_sta_record_get');

// Getting a bit more complex here, but would make the code more explicit in how it works.

// but also give it a function that allows it to get its space????


// set the id of the record....

// fixed fields....


// Bit fields....
//    Worth having one for if the record is a root ie table record, not nested within one.

// Does look like improved iteration of the place records is important....

// Maybe just have a Place_I32_Record_Reader????

//  And yes will be able to read sequential IDs easily enough.



class Compact_Int32Array_Record {

    // Will need to access the various different thigns inside that record...

    constructor(spec = {}, fn_allocate_ta) {

        if (spec.table) {
            // this.table = spec.table;

            Object.defineProperty(this, 'table', {get() {return spec.table}})

        }

        // Would need to parse it into the record if needed.
        //   Or can be supplied the ta directly

        //let ta;


        // Referring back to the table?
        //   the Places class instance.
        //     can then access the tag names etc.

        // Maybe providing the places in a function call as needed would work best regarding memory leaks.
        //   


        



        // ???3 external id



        if (spec instanceof Int32Array) {
            this.ta = spec;

        } else {
            // an object???

            //   need to parse / get the ta from that object.

            // a parse function....

            const t_spec = tof(spec);
            if (t_spec === 'object') {


                //console.log('spec', spec);

                if (spec.ta instanceof Int32Array) {
                    this.ta = spec.ta;
                } else if (spec.sta instanceof Int32Array) {
                    this.ta = spec.sta;
                }
                


                // or don't parse it exactly here????
                //  this.ta = this.parse(spec, fn_allocate_ta);
                //   best not to parse it yet???



                // parse to ta?????
                
                //console.log('spec', spec);
                //console.trace();
                //throw 'stop';
                

            } else {
                console.trace();
                throw 'stop';
            }


            



        }


        // Always array item 0 is the total length.
        // Then array item 1 is the record type.
    }

    // and iterate the inner records....

    // and the number of inner records....
    //   or child records really.

    /*

    get inner_record_count() {
        return sta_record_get.inner_item_count(this.ta);
    }


    * inner() {
        //console.log('* inner()');
        for (const sta_inner of sta_record_get.iterate_inner_items(this.ta)) {
            // 


            
            const inner_record = new this.constructor({ta: sta_inner, table: this.table});
            yield inner_record;
        }
    }

    */



    set_bitfield_value(idx, value) {
        const bit_mask = 1 << idx;
        if (value) {
            this.ta[3] = this.ta[3] | bit_mask;
        } else {
            this.ta[3] = this.ta[3] & ~bit_mask;
        }
    }  
    get_bitfield_value(idx) {
        const bit_mask = 1 << idx;

        //return 

        if ((this.ta[3] & bit_mask) === 0) {
            return 0;
        } else {
            return 1;
        }

    }

    // its idx....
    //  will be ta[2]

    get idx() {
        return this.ta[2];
    }

    
    parse(o_record) {
        console.trace();
        throw 'should use subclass parse function instead';
    }

}

module.exports = Compact_Int32Array_Record;