const { impl_emitter } = require('../../emitters');
const args_generator = require('../impls/gen_impls_args');
const { isPtrType,
        getNapiType,
        getNapiValueType,
        getNapiCreateFunc } = require('../types');

impl_emitter.register('vir[\\w]+GetUUIDString', func => {
    let out =
       `napi_value libvirt_${func.name}(napi_env env, napi_callback_info info) {
            napi_status status;
            napi_value n_retval;
       `;

    if(func.args.length) {

        out += `
            napi_valuetype valuetype;

            // get callback_info
            size_t argc = ${func.args.length};
            napi_value args[argc];
            status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
            assert(status == napi_ok);
        `;
        
        out += `
            // Check args length
            if (argc != ${func.args.length}) {
              napi_throw_type_error(env, NULL, "Wrong number of arguments");
              return NULL;
            }
        `;

        func.args.forEach((arg, idx) => {
            let napiType = getNapiType(arg.type);
            let napiValueType = getNapiValueType(arg.type);

            out += `
                // check arg${idx}'s type
                status = napi_typeof(env, args[${idx}], &valuetype);
                assert(status == napi_ok);

                if (valuetype != ${napiType}) {
                    napi_throw_type_error(env, NULL, "Wrong argument type ${idx}");
                    return NULL;
                }
            `;

            out += args_generator.getGen(napiValueType)(arg, idx);
      });
    }

    // perform C call
    out += `
        char buf[VIR_UUID_STRING_BUFLEN];
        ${func.ret[0].type} c_retval = ${func.name}(arg0, buf);
    `;

    out += `
        if(c_retval < 0) {
            status = napi_get_null(env, &n_retval);
            assert(status == napi_ok);
            return n_retval;
        }
       `;

    out += `
        status = napi_create_string_utf8(env, buf, strlen(buf), &n_retval);
        assert(status == napi_ok);

        return n_retval;
    }`;

    return out;
  }
);
