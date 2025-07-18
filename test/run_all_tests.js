// Updated global helper for inner tests with icon on the left.
global.subtest = function(label, fn) {
    try {
        fn();
        console.log(`    \x1b[32m✔\x1b[0m  ${label}`);
    } catch (err) {
        console.log(`    \x1b[31m✘\x1b[0m  ${label}`);
        console.error("         " + err);
    }
};

const tests = ['./simple_table_test', './name_value_pair_table_test'];

tests.forEach(test => {
    console.log(`\n----- Running test: ${test} -----`);
    try {
        require(test); // each test file can call subtest() for inner tests
        console.log('\x1b[32m✔ Test passed\x1b[0m');
    } catch (err) {
        console.error('\x1b[31m✘ Test failed\x1b[0m');
        console.error(err);
    }
    console.log(`----- Finished test: ${test} -----\n`);
});

console.log('ALL TESTS COMPLETED.');