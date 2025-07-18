
const COMPACT_TABLE = 111;



const min_valid_record_length = 3;   //[length, type, bitfield]


const {tof, each, is_array, Evented_Class} = require('lang-mini');

// The shortest table...

// [2, 111]
// A table of length 2, nothing else inside it.
//   (no bitfield either)

// Maybe the 3rd value in the i32a will always be a 32 bit bitfield.


// Maybe Dynamic_Growing_TA_Container will help????

// Much larger default initial capacity?



//const default_initial_capacity = 1024;

const default_initial_capacity = 1024 * 1024;

// and capacity scaling

//const default_fixed_capacity_increase = 512;

const default_fixed_capacity_increase = 1024 * 1024;

const default_scale_capacity_increase = 1.25;

const Compact_Int32Array_Record = require('./Compact_Int32Array_Record');
const Stringtable = require('./Stringtable');


// Give it the Record class in the spec instead perhaps????


class Compact_Int32Array_Table extends Evented_Class {
    constructor(spec = {}, Record = Compact_Int32Array_Record) {

        // has its own ta....

        //  could be given a ta....
        super();

        if (spec.Record) {
            this.Record = spec.Record;
            Record = spec.Record;
        } else {
            this.Record = Record;
        }

        this.o_named_property_stringtables = {};

        if (spec instanceof Int32Array) {
            // validate the ta first.

            const validate_spec_ta = spec_ta => {

                if (spec_ta instanceof Int32Array) {
                    if (spec_ta.length >= min_valid_record_length) {
                        if (spec_ta[0] === spec_ta.length) {
                            return false;
                        }
                    } else {
                        return false;
                    }

                } else {
                    return false;
                }

                

                return true;
            }

            const is_valid_ta = validate_spec_ta(spec);
            if (is_valid_ta) {

                // should start with its length, then have a constant indicating its a table.

                this.ta = spec;

            } else {
                console.trace();
                throw 'stop';
            }

            

        } else {


            // default_initial_capacity

            //this.capacity = default_initial_capacity;

            // parse first???

            this.ta = new Int32Array(default_initial_capacity);
            this.pos_w = 0;

            this.next_record_id = 0;


            // Maybe no spec....

            // Would need to add records dynamically.

            //   Set up the dynamic sized ta....

            // capacity
            // capacity fixed increase when needed
            // capacity scale increase when needed





        }

        this.capacity_fixed_increase = default_fixed_capacity_increase;
        this.capacity_scale_increase = default_scale_capacity_increase;
    }

    // ensure named property value (get id)

    ensure_named_property_value(property_name, property_value) {
        

        const {o_named_property_stringtables} = this;

        if (!o_named_property_stringtables[property_name]) {
            o_named_property_stringtables[property_name] = new Stringtable();
            o_named_property_stringtables[property_name].name = property_name;
        }
        return o_named_property_stringtables[property_name].ensure(property_value);
    }




    // get named property value ids / idxs ????

    calculate_increased_capacity_length(required_remaining_capacity) {

        let capacity = this.capacity;
        const {capacity_fixed_increase, capacity_scale_increase, pos_w} = this;
        let remaining_capacity = capacity - pos_w;

        const calc_raised_cap = () => {
            let res = Math.round((capacity + capacity_fixed_increase) * capacity_scale_increase);
            remaining_capacity = res - pos_w;
            return res;

        }

        while (remaining_capacity < required_remaining_capacity) {
            capacity = calc_raised_cap();
        }
        return capacity;

    }

    ensure_capacity_for_next_record(next_record_length) {
        // 32 bit lengths.... 32 bits per value in the length.

        if (this.remaining_capacity < next_record_length) {
            // increase the capacity until there is space....

            //   calculate the increased capacity

            //console.log('BEGIN CAPACITY ENLARGEMENT this.remaining_capacity', this.remaining_capacity);
            //console.log('next_record_length', next_record_length);

            let ncap = this.calculate_increased_capacity_length(next_record_length);
            //console.log('this.capacity', this.capacity);
            //console.log('ncap', ncap);

            const nta = new Int32Array(ncap);
            nta.set(this.ta);
            this.ta = nta;
            //console.log('END CAPACITY ENLARGEMENT');




        }


    }

    get capacity() {


        const {ta} = this;
        return ta.length;

        //return this.ta.length;
    }

    get remaining_capacity() {
        return this.capacity - this.pos_w;
    }

    allocate_record_ta(length) {
        this.ensure_capacity_for_next_record(length);
        const res = this.ta.subarray(this.pos_w, this.pos_w + length);

        this.pos_w += length;
        return res;


    }


    // But will need to ensure the capacity for the record!!!



    add(item) {

        // if its a typed array....

        if (item instanceof this.Record) {
            // Should be easy enough to add....
            //   copy the ta into place...
            
            // use a Record_Validator....

            console.log('item is record: ', item);

            console.trace();
            throw 'NYI';




        } else if (item instanceof Int32Array) {
            // item at index 2 is the index of the item....

            // Make a copy of that array.
            //   or use set????



        } else {
            // if it's an obj....
            const t = tof(item);
            if (t === 'object') {

                //console.log('adding item:', item);

                // More to identify the object type here....
                //   May be adding a whole load of data in a structured object.

                // May want parser classes too for this.

                // object containing named arrays only....

                let item_contains_only_arrays = true;
                each(item, (value, key, stop) => {

                    if (!is_array(value)) {
                        item_contains_only_arrays = false;
                        stop();
                    }

                });

                if (item_contains_only_arrays) {

                    // 

                    // then their keys will be the types....

                    each(item, (arr_records, record_type) => {
                        //console.log('');
                        //console.log('record_type', record_type);

                        each(arr_records, record => {

                            // can set the id of it???

                            //const {osm_id, name_en, tags, geom_type_name} = record;
                            //console.log('record', record);
                            //console.log('name_en', name_en);

                            // 

                            const res_add_record = this.add(record);

                            
                            // then call 'add' with that specific record????



                        })
                    });


                } else {

                    /*
                    console.trace();
                    console.log();
                    console.log('adding item:', item);
                    console.log();
                    throw 'NYI';
                    */

                    // normal type of object... check for that?
                    //   will use the record parser?

                    // Or object record validator???
                    //   Needs to have some properties first....?

                    // makes more sense to use a record parser....

                    const sequential_id_for_record = this.next_record_id++;
                    // pass in that sequential ID???
                    const parsed_record = this.parse_record(item);
                    parsed_record.ta[2] = sequential_id_for_record;
                    return sequential_id_for_record;


                    //console.trace();

                    //throw 'stop';

                }





            } else {
                console.trace();
                throw 'NYI';
            }

        }

        // item needs to be parsed????
        //   create the record class instance....?

        // if the item is standard item object, make a record out of it....

        // is it a Record already?


    }

    parse_record(record) {
        console.trace();
        console.log('record', record);
        throw 'stop - use subclass parse_record function instead.'
    }

    get length() {

        // The next record id needs to be properly restored from disk....

        //  Not reloaded / recalculated properly.
        //console.log('this.next_record_id', this.next_record_id);

        return this.next_record_id;
    }

    // bytes_allocated_and_used???

    // estimate_data_byte_length

    // bytes_estimate
    get bytes_estimate() {

        // See about loading many more places into this system....
        //   Maybe it would take too much space though.



        // Need to also include estimated size of the stringtable(s).

        // o_named_property_stringtables

        //console.log('this.o_named_property_stringtables', this.o_named_property_stringtables);

        let l_strings_data = 0;

        // get the bytes_estimate from each of these stringtables....

        const getByteLength = (str) => {
            const encoder = new TextEncoder();
            const byteArray = encoder.encode(str);
            return byteArray.length;
        }

        each(this.o_named_property_stringtables, (stringtable, property_name) => {
            l_strings_data += stringtable.bytes_estimate;
            l_strings_data += getByteLength(property_name);



        })

        //console.trace();
        //throw 'NYI';

        console.log('l_strings_data', l_strings_data);


        return l_strings_data + (this.pos_w * this.ta.BYTES_PER_ELEMENT);
    }






    // number of bytes stored within allocated structure?

    // bytes stored being different to bytes allocated?




    * sta_records() {
        const {ta} = this;
        let pos = 0;

        let l_record = ta[pos] / ta.BYTES_PER_ELEMENT;
        let pos_next = pos + l_record;


        let i_record = 0;

        //const table_num_overhead_records = 4;

        //pos += table_num_overhead_records;

        while (l_record > 0 && pos < ta.length - 1) {
            const sta = ta.subarray(pos, pos_next);
            yield sta;

            // 

            // Was the ta made longer than needed???

            //console.log('i_record', i_record);
            //console.log('l_record', l_record);
            //console.log('ta.length', ta.length);

            /*
            if (l_record === 0) {
                console.log('pos', pos);

                // seems to be nothing there!
                //   was something missing from being written? overcalculating length?
                //     or because it's dynamically allocated :)


                console.log('ta.subarray(pos)', ta.subarray(pos));

                console.trace();
                throw 'stop';

            }
                */

            pos = pos_next;
            l_record = ta[pos] / ta.BYTES_PER_ELEMENT;
            pos_next = pos + l_record;
            i_record++;

        }
    }

    * records() {



        const {Record} = this;

        //console.log('Record', Record);

        //console.trace();
        //throw 'stop';


        for (const sta of this.sta_records()) {
            const record = new Record({sta, table: this});
            yield record;
        }
    }
    
    // And code for reading records too....

    // Getters to get info from within the records.




    // and push / add records???
    //   will generally add them sequentially.
    //     though in some cases will load many / all at once as i32a data.


    // get a record's ta by its sequential table id
    // or by external id????


}

module.exports = Compact_Int32Array_Table;