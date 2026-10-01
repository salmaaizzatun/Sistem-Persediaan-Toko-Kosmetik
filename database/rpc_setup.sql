-- Run this file in Supabase SQL Editor when the app reports that
-- public.proses_transaksi cannot be found in the schema cache.

drop function if exists public.proses_transaksi(text, bigint, text, jsonb);

create function public.proses_transaksi(
    p_tipe text,
    p_supplier_id bigint,
    p_keterangan text,
    p_items jsonb
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
    v_tipe text := upper(coalesce(p_tipe, ''));
    v_transaksi_id bigint;
    v_nomor_transaksi text;
    v_item jsonb;
    v_produk_id bigint;
    v_jumlah integer;
    v_harga numeric(15, 2);
    v_stok integer;
    v_total numeric(15, 2) := 0;
begin
    if v_tipe not in ('MASUK', 'KELUAR') then
        raise exception 'Tipe transaksi harus MASUK atau KELUAR.';
    end if;

    if jsonb_typeof(p_items) is distinct from 'array' then
        raise exception 'Detail transaksi harus berbentuk array.';
    end if;

    if jsonb_array_length(p_items) = 0 then
        raise exception 'Transaksi harus memiliki minimal satu produk.';
    end if;

    v_nomor_transaksi := 'TRX-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS')
        || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);

    insert into public.transaksi (
        nomor_transaksi,
        tipe_transaksi,
        supplier_id,
        keterangan
    ) values (
        v_nomor_transaksi,
        v_tipe,
        p_supplier_id,
        nullif(trim(coalesce(p_keterangan, '')), '')
    )
    returning transaksi_id into v_transaksi_id;

    for v_item in select value from jsonb_array_elements(p_items)
    loop
        begin
            v_produk_id := (v_item ->> 'produk_id')::bigint;
            v_jumlah := (v_item ->> 'jumlah')::integer;
            v_harga := (v_item ->> 'harga')::numeric(15, 2);
        exception
            when invalid_text_representation or numeric_value_out_of_range then
                raise exception 'Detail transaksi tidak valid.';
        end;

        if v_produk_id is null or v_jumlah is null or v_jumlah <= 0
           or v_harga is null or v_harga < 0 then
            raise exception 'Produk, jumlah, atau harga transaksi tidak valid.';
        end if;

        select stok into v_stok
        from public.produk
        where produk_id = v_produk_id
        for update;

        if not found then
            raise exception 'Produk dengan ID % tidak ditemukan.', v_produk_id;
        end if;

        if v_tipe = 'KELUAR' and v_jumlah > v_stok then
            raise exception 'Stok produk ID % tidak mencukupi.', v_produk_id;
        end if;

        update public.produk
        set stok = case
            when v_tipe = 'MASUK' then stok + v_jumlah
            else stok - v_jumlah
        end
        where produk_id = v_produk_id;

        insert into public.detail_transaksi (
            transaksi_id,
            produk_id,
            jumlah,
            harga
        ) values (
            v_transaksi_id,
            v_produk_id,
            v_jumlah,
            v_harga
        );

        v_total := v_total + (v_jumlah * v_harga);
    end loop;

    update public.transaksi
    set total = v_total
    where transaksi_id = v_transaksi_id;

    return jsonb_build_object(
        'transaksi_id', v_transaksi_id,
        'nomor_transaksi', v_nomor_transaksi
    );
end;
$$;

grant execute on function public.proses_transaksi(text, bigint, text, jsonb)
to anon, authenticated;

notify pgrst, 'reload schema';
