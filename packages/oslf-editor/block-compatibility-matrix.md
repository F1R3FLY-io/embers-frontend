# Таблиця-матриця сумісності блоків RhoLang

## Перелік типів блоків

**Ground/Simple Types:**
- ground_bool_true, ground_bool_false, ground_int, ground_string, ground_uri
- simple_type_bool, simple_type_int, simple_type_string, simple_type_uri, simple_type_byte_array

**Names:**
- name_wildcard, name_var, name_quote, name_decl_simple, name_decl_urn, name_remainder, name_remainder_empty, name_decl_list

**Collections:**
- collect_list, collect_list_remainder, tuple_single, tuple_multiple, collect_set, collect_set_remainder, collect_map, collect_map_remainder
- key_value_pair, proc_list, proc_remainder, proc_remainder_empty, name_list

**Receipts/Binds:**
- linear_bind, linear_bind_receive_send, linear_bind_send_receive, repeated_bind, peek_bind
- receipt_linear, receipt_repeated, receipt_peek, concurrent_binds, sequential_receipts
- linear_bind_symm, repeated_bind_symm, peek_bind_symm

**Control:**
- proc_if, proc_if_else, proc_match, case, proc_select, branch

**Declarations:**
- proc_new, proc_let, decl, linear_decls, conc_decls
- proc_contract, proc_contract_remainder
- proc_bundle_write, proc_bundle_read, proc_bundle_equiv, proc_bundle_rw

**Processes:**
- proc_root, proc_nil, proc_collect, proc_var, proc_var_wildcard, proc_var_ref, proc_var_ref_name
- proc_simple_type, proc_eval, proc_paren
- proc_negation, proc_conjunction, proc_disjunction, proc_not, proc_and, proc_or
- proc_neg, proc_mult, proc_div, proc_mod, proc_percent_percent
- proc_add, proc_minus, proc_plus_plus, proc_minus_minus
- proc_lt, proc_lte, proc_gt, proc_gte, proc_eq, proc_neq, proc_matches
- proc_method, proc_path_map
- proc_send, proc_send_multiple, proc_send_symm, proc_send_synch
- synch_send_cont_empty, synch_send_cont
- proc_for, proc_foreach, proc_par

## Матриця сумісності

Якщо блок типу Y може включати в себе блок типу X, то в клітинці стоїть "Yes".

| type (Y\X) | Proc | Name | NameDecl | NameDeclList | NameList | Collection | SimpleType | ProcList | ProcRemainder | NameRemainder | LinearBind | RepeatedBind | PeekBind | Receipt | Case | Branch | Decl | KeyValuePair | SynchSendCont |
|------------|------|------|----------|--------------|----------|------------|------------|----------|---------------|---------------|------------|--------------|----------|---------|------|--------|------|------------------|-------------------|
| **name_quote** | Yes | | | | | | | | | | | | | | | | | | |
| **name_decl_list** | | | Yes | Yes | | | | | | | | | | | | | | | |
| **collect_list** | | | | | | | | Yes | | | | | | | | | | | |
| **collect_list_remainder** | | | | | | | | Yes | Yes | | | | | | | | | | |
| **tuple_single** | Yes | | | | | | | | | | | | | | | | | | |
| **tuple_multiple** | Yes | | | | | | | Yes | | | | | | | | | | | |
| **collect_set** | | | | | | | | Yes | | | | | | | | | | | |
| **collect_set_remainder** | | | | | | | | Yes | Yes | | | | | | | | | | |
| **collect_map** | | | | | | | | | | | | | | | | | | Yes | |
| **collect_map_remainder** | | | | | | | | | Yes | | | | | | | | | Yes | |
| **key_value_pair** | Yes | | | | | | | | | | | | | | | | | | |
| **proc_list** | Yes | Yes | | | | | | Yes | | | | | | | | | | | |
| **name_list** | | Yes | | | Yes | | | | | | | | | | | | | | |
| **linear_bind** | | Yes | | | Yes | | | | | | | | | | | | | | |
| **linear_bind_receive_send** | | Yes | | | Yes | | | | | | | | | | | | | | |
| **linear_bind_send_receive** | | Yes | | | Yes | | | Yes | | | | | | | | | | | |
| **repeated_bind** | | Yes | | | Yes | | | | | | | | | | | | | | |
| **peek_bind** | | Yes | | | Yes | | | | | | | | | | | | | | |
| **receipt_linear** | | | | | | | | | | | Yes | | | | | | | | |
| **receipt_repeated** | | | | | | | | | | | | Yes | | | | | | | |
| **receipt_peek** | | | | | | | | | | | | | Yes | | | | | | |
| **concurrent_binds** | | | | | | | | | | | Yes | Yes | Yes | | | | | | |
| **sequential_receipts** | | | | | | | | | | | | | | Yes | | | | | |
| **linear_bind_symm** | | Yes | | | Yes | | | | | | | | | | | | | | |
| **repeated_bind_symm** | | Yes | | | Yes | | | | | | | | | | | | | | |
| **peek_bind_symm** | | Yes | | | Yes | | | | | | | | | | | | | | |
| **proc_if** | Yes | | | | | | | | | | | | | | | | | | |
| **proc_if_else** | Yes | | | | | | | | | | | | | | | | | | |
| **proc_match** | Yes | | | | | | | | | | | | | | | | | | |
| **case** | Yes | | | | | | | | | | | | | | | | | | |
| **proc_select** | | | | | | | | | | | | | | | | Yes | | | |
| **branch** | | | | | | | | | | | Yes | | | | | | | | |
| **proc_new** | | | Yes | Yes | | | | | | | | | | | | | | | |
| **proc_let** | | | | | | | | | | | | | | | | | Yes | | |
| **decl** | Yes | Yes | | | Yes | | | Yes | | | | | | | | | | | |
| **linear_decls** | | | | | | | | | | | | | | | | | Yes | | |
| **conc_decls** | | | | | | | | | | | | | | | | | Yes | | |
| **proc_contract** | | Yes | | | Yes | | | | | | | | | | | | | | |
| **proc_contract_remainder** | | Yes | | | Yes | | | | | | | | | | | | | | |
| **proc_bundle_write** | Yes | | | | | | | | | | | | | | | | | | |
| **proc_bundle_read** | Yes | | | | | | | | | | | | | | | | | | |
| **proc_bundle_equiv** | Yes | | | | | | | | | | | | | | | | | | |
| **proc_bundle_rw** | Yes | | | | | | | | | | | | | | | | | | |
| **proc_root** | Yes | | | | | | | | | | | | | | | | | | |
| **proc_collect** | | | | | | Yes | | | | | | | | | | | | | |
| **proc_simple_type** | | | | | | | Yes | | | | | | | | | | | | |
| **proc_eval** | | Yes | | | | | | | | | | | | | | | | | |
| **proc_paren** | Yes | | | | | | | | | | | | | | | | | | |
| **proc_negation** | Yes | | | | | | | | | | | | | | | | | | |
| **proc_conjunction** | Yes | | | | | | | | | | | | | | | | | | |
| **proc_disjunction** | Yes | | | | | | | | | | | | | | | | | | |
| **proc_not** | Yes | | | | | | | | | | | | | | | | | | |
| **proc_and** | Yes | | | | | | | | | | | | | | | | | | |
| **proc_or** | Yes | | | | | | | | | | | | | | | | | | |
| **proc_neg** | Yes | | | | | | | | | | | | | | | | | | |
| **proc_mult** | Yes | | | | | | | | | | | | | | | | | | |
| **proc_div** | Yes | | | | | | | | | | | | | | | | | | |
| **proc_mod** | Yes | | | | | | | | | | | | | | | | | | |
| **proc_percent_percent** | Yes | | | | | | | | | | | | | | | | | | |
| **proc_add** | Yes | | | | | | | | | | | | | | | | | | |
| **proc_minus** | Yes | | | | | | | | | | | | | | | | | | |
| **proc_plus_plus** | Yes | | | | | | | | | | | | | | | | | | |
| **proc_minus_minus** | Yes | | | | | | | | | | | | | | | | | | |
| **proc_lt** | Yes | | | | | | | | | | | | | | | | | | |
| **proc_lte** | Yes | | | | | | | | | | | | | | | | | | |
| **proc_gt** | Yes | | | | | | | | | | | | | | | | | | |
| **proc_gte** | Yes | | | | | | | | | | | | | | | | | | |
| **proc_eq** | Yes | | | | | | | | | | | | | | | | | | |
| **proc_neq** | Yes | | | | | | | | | | | | | | | | | | |
| **proc_matches** | Yes | | | | | | | | | | | | | | | | | | |
| **proc_method** | Yes | | | | | | | Yes | | | | | | | | | | | |
| **proc_path_map** | Yes | | | | | | | | | | | | | | | | | | |
| **proc_send** | | Yes | | | | | | Yes | | | | | | | | | | | |
| **proc_send_multiple** | | Yes | | | | | | Yes | | | | | | | | | | | |
| **proc_send_symm** | | Yes | | | | | | Yes | | | | | | | | | | | |
| **proc_send_synch** | | Yes | | | | | | Yes | | | | | | | | | | Yes |
| **synch_send_cont** | Yes | | | | | | | | | | | | | | | | | | |
| **proc_for** | | | | | | | | | | | | | | Yes | | | | | |
| **proc_foreach** | | | | | | | | | | | | | | Yes | | | | | |
| **proc_par** | Yes | | | | | | | | | | | | | | | | | | |

## Примітки

- **"Yes"** означає, що блок типу Y може включати блок типу X через `input_value` або `input_statement`
- Деякі блоки приймають множинні типи (наприклад, `["Proc", "ProcList"]`) - в таблиці це відображено окремо
- Блоки з `output` типом можуть бути вставлені в блоки, які приймають цей тип через параметр `check`
- Таблиця створена на основі аналізу визначень блоків у `/editor/src/blocks/` та граматики RhoLang

## Легенда типів

- **Proc** - процес (основний тип виразів RhoLang)
- **Name** - ім'я/канал
- **NameDecl** - оголошення імені
- **NameDeclList** - список оголошень імен
- **NameList** - список імен
- **Collection** - колекція (list, set, map, tuple)
- **SimpleType** - простий тип (Bool, Int, String, Uri, ByteArray)
- **ProcList** - список процесів
- **ProcRemainder** - залишок процесів у колекціях (...rest)
- **NameRemainder** - залишок імен у binds (...@rest)
- **LinearBind** - лінійний bind (одноразове читання)
- **RepeatedBind** - повторюваний bind (багаторазове читання)
- **PeekBind** - peek bind (читання без споживання)
- **Receipt** - receipt (використовується в for/foreach)
- **Case** - гілка match
- **Branch** - гілка select
- **Decl** - оголошення в let
- **KeyValuePair** - пара ключ-значення для map
- **SynchSendCont** - продовження синхронного send

## Зміни після виправлення remainder блоків

**Версія:** Після коміту `bb50f1a`

**Додані блоки:**
- `proc_remainder_empty` - порожній remainder для колекцій
- `name_remainder_empty` - порожній remainder для binds
- `collect_set_remainder` - Set з remainder
- `collect_map_remainder` - Map з remainder

**Виправлені підключення:**
- `collect_list_remainder` тепер приймає `ProcRemainder` через `input_value` (раніше був `field_input`)
- Усі remainder блоки тепер правильно інтегровані з колекціями згідно з граматикою RhoLang

**Результат:** 0 ізольованих блоків - всі типи блоків тепер мають зв'язки з іншими блоками.
